// import { Injectable } from "@annotation/Ioc.annotation";
import { exec } from "child_process";

export interface ProcessItem {
  name: string;
  cmd: string;
  pid: number;
  ppid: number;
  load: number;
  mem: number;
  children?: ProcessItem[];
}

// @Injectable()
export class ProcessUtils {
  private map = new Map<number, ProcessItem>();
  private rootItem!: ProcessItem;
  private rootPid!: number;

  /**
   * 使用ps命令，获取所有进程
   * @constructor
   */
  public GetAllProcess(pid: number) {
    this.rootPid = pid;
    // @ts-ignore
    this.rootItem = {};
    return new Promise((resolve, reject) => {
      exec('which ps', {}, (err, stdout, stderr) => {
        if (err || stderr) {
          resolve({ message: 'ps not found', isRunScript: false });
        } else {
          const ps = stdout.toString().trim();
          const args = '-ax -o pid=,ppid=,pcpu=,pmem=,command=';

          exec(`${ps} ${args}`, {
            maxBuffer: 1000 * 1024, env: {LC_NUMERIC: 'en_US.UTF-8'}
          }, (err, stdout, stderr) => {

            if (err || (stderr && !stderr.includes('screen size is bogus'))) {
              resolve({ message: 'ps is error', isRunScript: false });
            } else {
              this.parsePsOutput(stdout, this.addToTree);
              if (Object.keys(this.rootItem).length == 0) {
                resolve({ message: `Root process pid: ${this.rootPid} not found`, isRunScript: false });
              } else {
                resolve(this.rootItem);
              }
            }
          })
        }
      })
    })
  }


  private parsePsOutput(stdout: string, addToTree: (pid: number, ppid: number, cmd: string, load: number, mem: number) => void): void {
    const PID_CMD = /^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+\.[0-9]+)\s+([0-9]+\.[0-9]+)\s+(.+)$/;
    const lines = stdout.toString().split('\n');
    for (const line of lines) {
      const matches = PID_CMD.exec(line.trim());
      if (matches && matches.length === 6) {
        this.addToTree(parseInt(matches[1]), parseInt(matches[2]), matches[5], parseFloat(matches[3]), parseFloat(matches[4]));
      }
    }
  }

  private addToTree(pid: number, ppid: number, cmd: string, load: number, mem: number): void {
    const parent = this.map.get(ppid);
    if (pid === this.rootPid || parent) {

      const item = {
        name: this.findName(cmd),
        cmd,
        pid,
        ppid,
        load,
        mem
      };
      this.map.set(pid, item);

      if (pid === this.rootPid) {
        this.rootItem = item;
      }

      if (parent) {
        if (!parent.children) {
          parent.children = [];
        }
        parent.children.push(item);
        if (parent.children.length > 1) {
          parent.children = parent.children.sort((a, b) => a.pid - b.pid);
        }
      }
    }
  }

  private findName(cmd: string): string {
    const SHARED_PROCESS_HINT = /--vscode-window-kind=shared-process/;
    const ISSUE_REPORTER_HINT = /--vscode-window-kind=issue-reporter/;
    const PROCESS_EXPLORER_HINT = /--vscode-window-kind=process-explorer/;
    const UTILITY_NETWORK_HINT = /--utility-sub-type=network/;
    const WINDOWS_CRASH_REPORTER = /--crashes-directory/;
    const WINDOWS_PTY = /\\pipe\\winpty-control/;
    const WINDOWS_CONSOLE_HOST = /conhost\.exe/;
    const TYPE = /--type=([a-zA-Z-]+)/;

    // find windows crash reporter
    if (WINDOWS_CRASH_REPORTER.exec(cmd)) {
      return 'electron-crash-reporter';
    }

    // find windows pty process
    if (WINDOWS_PTY.exec(cmd)) {
      return 'winpty-process';
    }

    //find windows console host process
    if (WINDOWS_CONSOLE_HOST.exec(cmd)) {
      return 'console-window-host (Windows internal process)';
    }

    // find "--type=xxxx"
    let matches = TYPE.exec(cmd);
    if (matches && matches.length === 2) {
      if (matches[1] === 'renderer') {
        if (SHARED_PROCESS_HINT.exec(cmd)) {
          return 'shared-process';
        }

        if (ISSUE_REPORTER_HINT.exec(cmd)) {
          return 'issue-reporter';
        }

        if (PROCESS_EXPLORER_HINT.exec(cmd)) {
          return 'process-explorer';
        }

        return `window`;
      } else if (matches[1] === 'utility') {
        if (UTILITY_NETWORK_HINT.exec(cmd)) {
          return 'utility-network-service';
        }
      }
      return matches[1];
    }

    // find all xxxx.js
    const JS = /[a-zA-Z-]+\.js/g;
    let result = '';
    do {
      matches = JS.exec(cmd);
      if (matches) {
        result += matches + ' ';
      }
    } while (matches);

    if (result) {
      if (cmd.indexOf('node ') < 0 && cmd.indexOf('node.exe') < 0) {
        return `electron_node ${result}`;
      }
    }
    return cmd;
  }
}