import { BoardsConfig } from '../../../browser/boards/boards-config';
import { Board, BoardsPackage, Port } from '../../../common/protocol';

export const aBoard: Board = {
  fqbn: 'some:board:fqbn',
  name: 'Some Arduino Board',
  port: { address: '/lol/port1234', protocol: 'serial' },
};
export const aPort: Port = {
  address: aBoard.port!.address,
  protocol: aBoard.port!.protocol,
};
export const aBoardConfig: BoardsConfig.Config = {
  selectedBoard: aBoard,
  selectedPort: aPort,
};
export const anotherBoard: Board = {
  fqbn: 'another:board:fqbn',
  name: 'Another Arduino Board',
  port: { address: '/kek/port5678', protocol: 'serial' },
};
export const anotherPort: Port = {
  address: anotherBoard.port!.address,
  protocol: anotherBoard.port!.protocol,
};
export const anotherBoardConfig: BoardsConfig.Config = {
  selectedBoard: anotherBoard,
  selectedPort: anotherPort,
};

export const aPackage: BoardsPackage = {
  author: 'someAuthor',
  availableVersions: ['some.ver.sion', 'some.other.version'],
  boards: [aBoard],
  deprecated: false,
  description: 'Some Arduino Board, Some Other Arduino Board',
  id: 'some:arduinoCoreId',
  installable: true,
  moreInfoLink: 'http://www.some-url.lol/',
  name: 'Some Arduino Package',
  summary: 'Boards included in this package:',
};

export const anInstalledPackage: BoardsPackage = {
  ...aPackage,
  installedVersion: 'some.ver.sion',
};
