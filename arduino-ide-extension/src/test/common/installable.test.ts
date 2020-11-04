import { expect } from 'chai';
import { Installable } from '../../common/protocol/installable';

describe('installable', () => {

    describe('compare', () => {

        const testMe = Installable.Version.COMPARATOR;

        ([
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
        ] as Array<[string, string, number]>).forEach(([left, right, expectation]) => {
            it(`'${left}' should be ${expectation === 0 ? 'equal to' : expectation < 0 ? 'less than' : 'greater than'} '${right}'`, () => {
                const actual = testMe(left, right);
                expect(actual).to.be.equal(expectation);
            });
        });

    });

});
