import {expect} from 'chai';
import {Version} from '../../src/version';
import {RevenueHeroVersioningStrategy} from '../../src/versioning-strategies/revenuehero';
import * as sinon from 'sinon';

describe('RevenueHeroVersioningStrategy', () => {
  describe('when year changes', () => {
    let clock: sinon.SinonFakeTimers;

    before(() => {
      clock = sinon.useFakeTimers({
        // dec-2022 => jan-2023
        // major => 1 => 2
        now: new Date(2023, 0, 20, 0, 0),
        shouldAdvanceTime: true,
        toFake: ['Date'],
      });
    });

    after(() => {
      clock.restore();
    });

    it('bumps major', async () => {
      const strategy = new RevenueHeroVersioningStrategy();
      const oldVersion = Version.parse('1.11.30');

      const newVersion = await strategy.bump(oldVersion, []);

      expect(newVersion.toString()).to.equal('2.0.0');
    });
  });

  describe('when month changes', () => {
    let clock: sinon.SinonFakeTimers;

    before(() => {
      clock = sinon.useFakeTimers({
        // jan-2022 => feb-2022
        // minor from 0 => 1
        now: new Date(2022, 1, 20, 0, 0),
        shouldAdvanceTime: true,
        toFake: ['Date'],
      });
    });

    after(() => {
      clock.restore();
    });

    it('bumps minor', async () => {
      const strategy = new RevenueHeroVersioningStrategy();
      const oldVersion = Version.parse('1.0.30');

      const newVersion = await strategy.bump(oldVersion, []);

      expect(newVersion.toString()).to.equal('1.1.0');
    });
  });

  describe('when new release in a month', () => {
    let clock: sinon.SinonFakeTimers;

    before(() => {
      clock = sinon.useFakeTimers({
        // jan-2022
        now: new Date(2022, 0, 20, 0, 0),
        shouldAdvanceTime: true,
        toFake: ['Date'],
      });
    });

    after(() => {
      clock.restore();
    });

    it('bumps minor', async () => {
      const strategy = new RevenueHeroVersioningStrategy();
      const oldVersion = Version.parse('1.0.30');

      const newVersion = await strategy.bump(oldVersion, []);

      expect(newVersion.toString()).to.equal('1.0.31');
    });
  });
});
