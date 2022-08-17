import { BoardsConfig } from '../../../browser/boards/boards-config';
import { Board, BoardsPackage, Port } from '../../../common/protocol';

export const aBoard: Board = {
  fqbn: 'some:board:fqbn',
  name: 'Some Arduino Board',
  port: {
    id: '/lol/port1234|serial',
    address: '/lol/port1234',
    addressLabel: '/lol/port1234',
    protocol: 'serial',
    protocolLabel: 'Serial Port (USB)',
  },
};
export const aPort: Port = {
  id: aBoard.port!.id,
  address: aBoard.port!.address,
  addressLabel: aBoard.port!.addressLabel,
  protocol: aBoard.port!.protocol,
  protocolLabel: aBoard.port!.protocolLabel,
};
export const aBoardConfig: BoardsConfig.Config = {
  selectedBoard: aBoard,
  selectedPort: aPort,
};
export const anotherBoard: Board = {
  fqbn: 'another:board:fqbn',
  name: 'Another Arduino Board',
  port: {
    id: '/kek/port5678|serial',
    address: '/kek/port5678',
    addressLabel: '/kek/port5678',
    protocol: 'serial',
    protocolLabel: 'Serial Port (USB)',
  },
};
export const anotherPort: Port = {
  id: anotherBoard.port!.id,
  address: anotherBoard.port!.address,
  addressLabel: anotherBoard.port!.addressLabel,
  protocol: anotherBoard.port!.protocol,
  protocolLabel: anotherBoard.port!.protocolLabel,
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

export const emptyBoardConfig: BoardsConfig.Config = {
  selectedBoard: undefined,
  selectedPort: undefined,
};
