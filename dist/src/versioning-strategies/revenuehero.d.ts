import { VersionUpdater } from '../versioning-strategy';
import { DefaultVersioningStrategy } from './default';
/**
 *  year.month.release_count as our versioning strategy
 */
export declare class RevenueHeroVersioningStrategy extends DefaultVersioningStrategy {
    determineReleaseType(): VersionUpdater;
}
