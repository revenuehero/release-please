"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueHeroVersioningStrategy = void 0;
const version_1 = require("../version");
const default_1 = require("./default");
const RH_INCEPTION = 2021;
class RevenueHeroVersionUpdater {
    bump(version) {
        const currentDate = new Date();
        // 1. years since revenuehero was started = major
        const major = currentDate.getFullYear() - RH_INCEPTION;
        // 2. current month = minor
        const minor = currentDate.getMonth();
        // 3. current release count in a month
        let patch = version.patch;
        if (minor !== version.minor) {
            patch = 0;
        }
        else {
            patch = patch + 1;
        }
        return new version_1.Version(major, minor, patch);
    }
}
/**
 *  year.month.release_count as our versioning strategy
 */
class RevenueHeroVersioningStrategy extends default_1.DefaultVersioningStrategy {
    determineReleaseType() {
        return new RevenueHeroVersionUpdater();
    }
}
exports.RevenueHeroVersioningStrategy = RevenueHeroVersioningStrategy;
