const gulp = require('gulp')
// 编译jade文件为hrml
const jade = require('gulp-jade')
// gulp 文件监听
const watch = require('gulp-watch')
// 处理gulp错误，防止程序报错终止
const plumber = require('gulp-plumber')
const path = require('path')
const less = require('gulp-less')

/**
 * 编译jade为html
 */
gulp.task('jade', function () {
    return gulp.src("./src/application/page/**/*.jade")
        .pipe(plumber({
            errHandler: e => {
                gutil.beep()
                gutil.log(e)
            }
        }))
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest("./dist/application/page"))
})

/**
 * 编译less为css
 */
gulp.task('less', function () {
    return gulp.src('src/application/assets/less/**/*.less')
        .pipe(less())
        .pipe(gulp.dest('./dist/application/assets/css'))
});

gulp.task('copy',  function() {
    return gulp.src(['src/application/assets/**/*','!src/**/less/**','!src/**/less'])
      .pipe(gulp.dest('./dist/application/assets'))
});

/**
 * 监听用户在 src/ 的所有文件操作
 */
gulp.task('file', function () {
    gulp.watch(
        ['src/application/page/**/*','src/application/layout/*','src/application/components/*'],
        gulp.parallel('jade')
    )
    gulp.watch('src/application/assets/less/**/*.less', gulp.parallel('less'))
    gulp.watch('src/application/assets/**/*', gulp.parallel('copy'))
});

gulp.task('default', gulp.series('file'))
