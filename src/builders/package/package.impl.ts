import { build, Configuration, Platform, Arch } from 'electron-builder';
import { writeFile } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

import {
    BuilderContext,
    BuilderOutput,
    createBuilder
} from '@angular-devkit/architect';
import { JsonObject } from '@angular-devkit/core';

export interface PackageElectronBuilderOptions extends Configuration {
    name: string;
    frontendProject: string;
    out: string;
}

export interface PackageElectronBuilderOutput extends BuilderOutput {
    target?: any;
    outputPath: string | string[];
}

export default createBuilder<JsonObject & PackageElectronBuilderOptions>(run);

async function run(
    options: JsonObject & PackageElectronBuilderOptions,
    context: BuilderContext
): Promise<any> {
    await promisify(writeFile)(
        join(context.workspaceRoot, 'dist', 'apps', options.name, 'index.js'),
        `const Main = require('./${options.name}/main.js');`,
        { encoding: 'utf8' }
    );
    const targets = new Map<Platform, Map<Arch, string[]>>();
    targets.set(
        Platform.MAC.createTarget()
            .entries()
            .next().value[0],
        Platform.MAC.createTarget()
            .entries()
            .next().value[1]
    );
    targets.set(
        Platform.WINDOWS.createTarget()
            .entries()
            .next().value[0],
        Platform.WINDOWS.createTarget()
            .entries()
            .next().value[1]
    );
    await build({
        targets,
        config: {
            win: {
                target: 'portable'
            },
            mac: {
                forceCodeSigning: false,
                target: 'default'
            },
            directories: {
                output: join(context.workspaceRoot, options.out)
            },
            files: [
                '**/package.json',
                {
                    from: `./dist/apps/${options.frontendProject}`,
                    to: options.frontendProject,
                    filter: ['*.*']
                },
                {
                    from: `./dist/apps/${options.name}`,
                    to: options.name,
                    filter: ['main.js']
                },
                {
                    from: `./dist/apps/${options.name}`,
                    to: '',
                    filter: ['index.js']
                }
            ],
            npmRebuild: false,
            asar: true
        }
    });
    return { success: true };
}
