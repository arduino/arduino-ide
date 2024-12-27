import type {
  Board,
  BoardsConfig,
  BoardsPackage,
  Port,
} from '../../../common/protocol';

export const aBoard: Board = {
  fqbn: 'some:board:fqbn',
  name: 'Some Arduino Board',
};
const aPort: Port = {
  address: '/lol/port1234',
  addressLabel: '/lol/port1234',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
};
export const aBoardsConfig: BoardsConfig = {
  selectedBoard: { name: aBoard.name, fqbn: aBoard.fqbn },
  selectedPort: aPort,
};
export const anotherBoard: Board = {
  fqbn: 'another:board:fqbn',
  name: 'Another Arduino Board',
};
export const anotherPort: Port = {
  address: '/kek/port5678',
  addressLabel: '/kek/port5678',
  protocol: 'serial',
  protocolLabel: 'Serial Port (USB)',
};
export const anotherBoardsConfig: BoardsConfig = {
  selectedBoard: { name: anotherBoard.name, fqbn: anotherBoard.fqbn },
  selectedPort: anotherPort,
};

export const aPackage: BoardsPackage = {
  author: 'someAuthor',
  availableVersions: ['some.ver.sion', 'some.other.version'],
  boards: [aBoard],
  deprecated: false,
  description: 'Some Arduino Board, Some Other Arduino Board',
  id: 'some:arduinoCoreId',
  moreInfoLink: 'http://www.some-url.lol/',
  name: 'Some Arduino Package',
  summary: 'Boards included in this package:',
  types: ['Arduino'],
};

export const anInstalledPackage: BoardsPackage = {
  ...aPackage,
  installedVersion: 'some.ver.sion',
};
