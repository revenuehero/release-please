"use strict";
// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageLockJson = void 0;
const json_stringify_1 = require("../../util/json-stringify");
const logger_1 = require("../../util/logger");
const package_json_1 = require("./package-json");
/**
 * Updates a Node.js package-lock.json file's version and '' package
 * version (for a v2 lock file).
 */
class PackageLockJson {
    constructor(options) {
        this.version = options.version;
        this.versionsMap = options.versionsMap;
    }
    updateContent(content, logger = logger_1.logger) {
        const parsed = JSON.parse(content);
        if (this.version) {
            logger.info(`updating from ${parsed.version} to ${this.version}`);
            parsed.version = this.version.toString();
        }
        if (parsed.lockfileVersion === 2 || parsed.lockfileVersion === 3) {
            if (this.version) {
                parsed.packages[''].version = this.version.toString();
            }
            if (this.versionsMap) {
                this.versionsMap.forEach((version, name) => {
                    let pkg = parsed.packages['node_modules/' + name];
                    if (!pkg) {
                        return;
                    }
                    // @see https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json#packages
                    if (pkg.link && pkg.resolved) {
                        pkg = parsed.packages[pkg.resolved];
                        if (!pkg) {
                            return;
                        }
                    }
                    pkg.version = version.toString();
                    if (pkg.dependencies) {
                        (0, package_json_1.updateDependencies)(pkg.dependencies, this.versionsMap);
                    }
                    if (pkg.devDependencies) {
                        (0, package_json_1.updateDependencies)(pkg.devDependencies, this.versionsMap);
                    }
                    if (pkg.peerDependencies) {
                        (0, package_json_1.updateDependencies)(pkg.peerDependencies, this.versionsMap);
                    }
                    if (pkg.optionalDependencies) {
                        (0, package_json_1.updateDependencies)(pkg.optionalDependencies, this.versionsMap);
                    }
                });
            }
        }
        if (this.versionsMap) {
            for (const [, obj] of Object.entries(parsed.packages)) {
                if (!obj.name) {
                    continue;
                }
                const ver = this.versionsMap.get(obj.name);
                if (ver) {
                    obj.version = ver.toString();
                }
            }
        }
        return (0, json_stringify_1.jsonStringify)(parsed, content);
    }
}
exports.PackageLockJson = PackageLockJson;
