"use strict";
// Copyright 2023 Google LLC
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
exports.JavaYoshiMonoRepo = void 0;
const versions_manifest_1 = require("../updaters/java/versions-manifest");
const version_1 = require("../version");
const changelog_1 = require("../updaters/changelog");
const changelog_json_1 = require("../updaters/changelog-json");
const commit_split_1 = require("../util/commit-split");
const composite_1 = require("../updaters/composite");
const errors_1 = require("../errors");
const java_1 = require("./java");
const java_update_1 = require("../updaters/java/java-update");
const filter_commits_1 = require("../util/filter-commits");
class JavaYoshiMonoRepo extends java_1.Java {
    /**
     * Override this method to post process commits
     * @param {ConventionalCommit[]} commits parsed commits
     * @returns {ConventionalCommit[]} modified commits
     */
    async postProcessCommits(commits) {
        if (commits.length === 0) {
            // For Java commits, push a fake commit so we force a
            // SNAPSHOT release
            commits.push({
                type: 'fake',
                bareMessage: 'fake commit',
                message: 'fake commit',
                breaking: false,
                scope: null,
                notes: [],
                files: [],
                references: [],
                sha: 'fake',
            });
        }
        return commits;
    }
    async needsSnapshot() {
        return versions_manifest_1.VersionsManifest.needsSnapshot((await this.getVersionsContent()).parsedContent);
    }
    async buildVersionsMap() {
        this.versionsContent = await this.getVersionsContent();
        return versions_manifest_1.VersionsManifest.parseVersions(this.versionsContent.parsedContent);
    }
    async getVersionsContent() {
        if (!this.versionsContent) {
            try {
                this.versionsContent = await this.github.getFileContentsOnBranch(this.addPath('versions.txt'), this.targetBranch);
            }
            catch (err) {
                if (err instanceof errors_1.GitHubAPIError) {
                    throw new errors_1.MissingRequiredFileError(this.addPath('versions.txt'), JavaYoshiMonoRepo.name, `${this.repository.owner}/${this.repository.repo}`);
                }
                throw err;
            }
        }
        return this.versionsContent;
    }
    async buildUpdates(options) {
        const updates = [];
        const version = options.newVersion;
        const versionsMap = options.versionsMap;
        updates.push({
            path: this.addPath('versions.txt'),
            createIfMissing: false,
            cachedFileContents: this.versionsContent,
            updater: new versions_manifest_1.VersionsManifest({
                version,
                versionsMap,
            }),
        });
        const pomFilesSearch = this.github.findFilesByFilenameAndRef('pom.xml', this.targetBranch, this.path);
        const buildFilesSearch = this.github.findFilesByFilenameAndRef('build.gradle', this.targetBranch, this.path);
        const dependenciesSearch = this.github.findFilesByFilenameAndRef('dependencies.properties', this.targetBranch, this.path);
        const readmeFilesSearch = this.github.findFilesByFilenameAndRef('README.md', this.targetBranch, this.path);
        const pomFiles = await pomFilesSearch;
        pomFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new java_update_1.JavaUpdate({
                    version,
                    versionsMap,
                    isSnapshot: options.isSnapshot,
                }),
            });
        });
        const buildFiles = await buildFilesSearch;
        buildFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new java_update_1.JavaUpdate({
                    version,
                    versionsMap,
                    isSnapshot: options.isSnapshot,
                }),
            });
        });
        const dependenciesFiles = await dependenciesSearch;
        dependenciesFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new java_update_1.JavaUpdate({
                    version,
                    versionsMap,
                    isSnapshot: options.isSnapshot,
                }),
            });
        });
        const readmeFiles = await readmeFilesSearch;
        readmeFiles.forEach(path => {
            updates.push({
                path: this.addPath(path),
                createIfMissing: false,
                updater: new java_update_1.JavaUpdate({
                    version,
                    versionsMap,
                    isSnapshot: options.isSnapshot,
                }),
            });
        });
        this.extraFiles.forEach(extraFile => {
            if (typeof extraFile === 'object') {
                return;
            }
            updates.push({
                path: extraFile,
                createIfMissing: false,
                updater: new java_update_1.JavaUpdate({
                    version,
                    versionsMap,
                    isSnapshot: options.isSnapshot,
                }),
            });
        });
        if (!options.isSnapshot) {
            updates.push({
                path: this.addPath(this.changelogPath),
                createIfMissing: true,
                updater: new changelog_1.Changelog({
                    version,
                    changelogEntry: options.changelogEntry,
                }),
            });
            // Bail early if the repository has no root changelog.json.
            // This file is used to opt into machine readable commits.
            const hasChangelogJson = await this.hasChangelogJson();
            if (hasChangelogJson && options.commits) {
                const changelogUpdates = [];
                const cs = new commit_split_1.CommitSplit({
                    includeEmpty: false,
                });
                const splitCommits = cs.split((0, filter_commits_1.filterCommits)(options.commits, this.changelogSections));
                for (const path of Object.keys(splitCommits)) {
                    const repoMetadata = await this.getRepoMetadata(path);
                    const artifactName = repoMetadata
                        ? repoMetadata['distribution_name']
                        : null;
                    if (repoMetadata && artifactName) {
                        this.logger.info(`Found artifact ${artifactName} for ${path}`);
                        changelogUpdates.push(new changelog_json_1.ChangelogJson({
                            artifactName,
                            version,
                            // We filter out "chore:" commits, to reduce noise in the upstream
                            // release notes. We will only show a product release note entry
                            // if there has been a substantial change, such as a fix or feature.
                            commits: splitCommits[path],
                            language: 'JAVA',
                        }));
                    }
                }
                updates.push({
                    path: 'changelog.json',
                    createIfMissing: false,
                    updater: new composite_1.CompositeUpdater(...changelogUpdates),
                });
            }
        }
        return updates;
    }
    async hasChangelogJson() {
        try {
            const content = await this.github.getFileContentsOnBranch('changelog.json', this.targetBranch);
            return !!content;
        }
        catch (e) {
            if (e instanceof errors_1.FileNotFoundError)
                return false;
            else
                throw e;
        }
    }
    async getRepoMetadata(path) {
        try {
            const content = await this.github.getFileContentsOnBranch(this.addPath(`${path}/.repo-metadata.json`), this.targetBranch);
            return content ? JSON.parse(content.parsedContent) : null;
        }
        catch (e) {
            if (e instanceof errors_1.FileNotFoundError)
                return null;
            else
                throw e;
        }
    }
    async updateVersionsMap(versionsMap, conventionalCommits) {
        let isPromotion = false;
        const modifiedCommits = [];
        for (const commit of conventionalCommits) {
            if (isPromotionCommit(commit)) {
                isPromotion = true;
                modifiedCommits.push({
                    ...commit,
                    notes: commit.notes.filter(note => !isPromotionNote(note)),
                });
            }
            else {
                modifiedCommits.push(commit);
            }
        }
        for (const versionKey of versionsMap.keys()) {
            const version = versionsMap.get(versionKey);
            if (!version) {
                this.logger.warn(`didn't find version for ${versionKey}`);
                continue;
            }
            if (isPromotion && isStableArtifact(versionKey)) {
                versionsMap.set(versionKey, version_1.Version.parse('1.0.0'));
            }
            else {
                const newVersion = await this.versioningStrategy.bump(version, modifiedCommits);
                versionsMap.set(versionKey, newVersion);
            }
        }
        return versionsMap;
    }
    initialReleaseVersion() {
        return version_1.Version.parse('0.1.0');
    }
}
exports.JavaYoshiMonoRepo = JavaYoshiMonoRepo;
const VERSIONED_ARTIFACT_REGEX = /^.*-(v\d+[^-]*)$/;
const VERSION_REGEX = /^v\d+(.*)$/;
/**
 * Returns true if the artifact should be considered stable
 * @param artifact name of the artifact to check
 */
function isStableArtifact(artifact) {
    const match = artifact.match(VERSIONED_ARTIFACT_REGEX);
    if (!match) {
        // The artifact does not have a version qualifier at the end
        return true;
    }
    const versionMatch = match[1].match(VERSION_REGEX);
    if (versionMatch && versionMatch[1]) {
        // The version is not stable (probably alpha/beta/rc)
        return false;
    }
    return true;
}
function isPromotionCommit(commit) {
    return commit.notes.some(isPromotionNote);
}
function isPromotionNote(note) {
    return note.title === 'RELEASE AS' && note.text === '1.0.0';
}
