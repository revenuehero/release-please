import {VersionUpdater} from '../versioning-strategy';
import {Version} from '../version';
import {DefaultVersioningStrategy} from './default';

const RH_INCEPTION = 2021;

class RevenueHeroVersionUpdater implements VersionUpdater {
  bump(version: Version): Version {
    const currentDate = new Date();

    // 1. years since revenuehero was started = major
    const major = currentDate.getFullYear() - RH_INCEPTION;
    // 2. current month = minor
    const minor = currentDate.getMonth();

    // 3. current release count in a month
    let patch = version.patch;

    if (minor !== version.minor) {
      patch = 0;
    } else {
      patch = patch + 1;
    }

    return new Version(major, minor, patch);
  }
}

/**
 *  year.month.release_count as our versioning strategy
 */
export class RevenueHeroVersioningStrategy extends DefaultVersioningStrategy {
  determineReleaseType(): VersionUpdater {
    return new RevenueHeroVersionUpdater();
  }
}
