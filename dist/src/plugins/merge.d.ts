import { ManifestPlugin } from '../plugin';
import { CandidateReleasePullRequest, RepositoryConfig } from '../manifest';
import { GitHub } from '../github';
export interface MergeOptions {
    pullRequestTitlePattern?: string;
    pullRequestHeader?: string;
    pullRequestFooter?: string;
    headBranchName?: string;
    forceMerge?: boolean;
}
/**
 * This plugin merges multiple pull requests into a single
 * release pull request.
 *
 * Release notes are broken up using `<summary>`/`<details>` blocks.
 */
export declare class Merge extends ManifestPlugin {
    private pullRequestTitlePattern?;
    private pullRequestHeader?;
    private pullRequestFooter?;
    private headBranchName?;
    private forceMerge;
    constructor(github: GitHub, targetBranch: string, repositoryConfig: RepositoryConfig, options?: MergeOptions);
    run(candidates: CandidateReleasePullRequest[]): Promise<CandidateReleasePullRequest[]>;
}
