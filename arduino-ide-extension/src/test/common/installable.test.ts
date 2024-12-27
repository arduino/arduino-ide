import { expect } from 'chai';
import { Installable } from '../../common/protocol/installable';

describe('installable', () => {
  const latest = '2.0.0';
  // shuffled versions
  const available: Installable.Version[] = [
    '1.4.1',
    '1.0.0',
    latest,
    '2.0.0-beta.1',
    '1.5',
  ];

  describe('compare', () => {
    const testMe = Installable.Version.COMPARATOR;

    (
      [
        ['1.8.1', '1.8.1', 0],
        ['1.8.1', '1.6.1', 1],
        ['1.6.1', '1.8.1', -1],
        ['1.6.1', '1.6.3', -1],
        ['5.1.1', '5.1.0', 1],
        ['5.1.0', '5.1.0-beta.1', 1],
        ['5.1.0-beta.1', '5.1.0', -1],
        ['5.1.0-beta.2', '5.1.0-beta.1', 1],
        ['5.1.0-beta.1', '5.1.0-beta.2', -1],
        ['5.1.0-beta.1', '5.1.1', -1],
        ['1.1.0', '1.1.0-a', 1],
        ['1.1.0-a', '1.1.0', -1],
        ['COM1', 'COM2', -1],
        ['COM1', 'COM10', -1],
        ['COM10', 'COM1', 1],
        ['COM10', 'COM2', 1],
        ['COM2', 'COM10', -1],
        ['COM10', 'COM10', 0],
      ] as Array<[string, string, number]>
    ).forEach(([left, right, expectation]) => {
      it(`'${left}' should be ${
        expectation === 0
          ? 'equal to'
          : expectation < 0
          ? 'less than'
          : 'greater than'
      } '${right}'`, () => {
        const actual = testMe(left, right);
        expect(actual).to.be.equal(expectation);
      });
    });
  });

  describe('latest', () => {
    it('should get the latest version from a shuffled array', () => {
      const copy = available.slice();
      expect(Installable.latest(copy)).to.be.equal(latest);
      expect(available).to.be.deep.equal(copy);
    });
  });

  describe('action', () => {
    const installLatest: Installable.Action = 'installLatest';
    const installSelected: Installable.Action = 'installSelected';
    const update: Installable.Action = 'update';
    const remove: Installable.Action = 'remove';
    const unknown: Installable.Action = 'unknown';
    const notAvailable = '0.0.0';

    it("should result 'unknown' if available is empty", () => {
      expect(Installable.action({ available: [] })).to.be.equal(unknown);
    });
    it("should result 'unknown' if installed is not in available", () => {
      expect(
        Installable.action({ available, installed: notAvailable })
      ).to.be.equal(unknown);
    });

    it("should result 'installLatest' if not installed and not selected", () => {
      expect(Installable.action({ available })).to.be.equal(installLatest);
    });
    it("should result 'installLatest' if not installed and latest is selected", () => {
      expect(Installable.action({ available, selected: latest })).to.be.equal(
        installLatest
      );
    });

    it("should result 'installSelected' if not installed and not latest is selected", () => {
      available
        .filter((version) => version !== latest)
        .forEach((selected) =>
          expect(
            Installable.action({
              available,
              selected,
            })
          ).to.be.equal(installSelected)
        );
    });
    it("should result 'installSelected' if installed and the selected is neither the latest nor the installed", () => {
      available.forEach((installed) =>
        available
          .filter((selected) => selected !== latest && selected !== installed)
          .forEach((selected) =>
            expect(
              Installable.action({
                installed,
                available,
                selected,
              })
            ).to.be.equal(installSelected)
          )
      );
    });

    it("should result 'update' if the installed version is not the latest and the latest is selected", () => {
      available
        .filter((installed) => installed !== latest)
        .forEach((installed) =>
          expect(
            Installable.action({
              installed,
              available,
              selected: latest,
            })
          ).to.be.equal(update)
        );
    });

    it("should result 'remove' if the selected version equals the installed version", () => {
      available.forEach((version) =>
        expect(
          Installable.action({
            installed: version,
            available,
            selected: version,
          })
        ).to.be.equal(remove)
      );
    });
  });
});
