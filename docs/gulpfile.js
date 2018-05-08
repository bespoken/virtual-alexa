const gulp = require('gulp');
const typedoc = require('gulp-typedoc');

gulp.task("default", ["typedoc"]);

gulp.task("typedoc", function () {
    gulp.src([
        "src/audioPlayer/AudioItem.ts",
        "src/audioPlayer/AudioPlayer.ts",
        "src/core/Device.ts",
        "src/core/SkillContext.ts",
        "src/core/SkillResponse.ts",
        "src/core/SkillSession.ts",
        "src/core/User.ts",
        "src/core/VirtualAlexa.ts",
    ]).pipe(typedoc({
            // TypeScript options (see typescript docs)
            excludePrivate: true,
            excludeNotExported: false,
            excludeExternals: true,
            module: "commonjs",
            gaID: "UA-99287066-2",
            gaSite: "docs.bespoken.io",
            mode: "file",
            name: "Bespoken Virtual Alexa",
            readme: "README.md",
            target: "ES6",
            out: "docs/api",
            version: true
        })
    );
});
