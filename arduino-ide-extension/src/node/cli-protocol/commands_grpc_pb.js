// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// This file is part of arduino-cli.
//
// Copyright 2018 ARDUINO SA (http://www.arduino.cc/)
//
// This software is released under the GNU General Public License version 3,
// which covers the main part of arduino-cli.
// The terms of this license can be found at:
// https://www.gnu.org/licenses/gpl-3.0.en.html
//
// You can be released from the requirements of the above licenses by purchasing
// a commercial license. Buying such a license is mandatory if you want to modify or
// otherwise use the software for commercial activities involving the Arduino
// software without disclosing the source code of your own applications. To purchase
// a commercial license, send an email to license@arduino.cc.
//
//
'use strict';
var grpc = require('grpc');
var commands_pb = require('./commands_pb.js');
var common_pb = require('./common_pb.js');
var board_pb = require('./board_pb.js');
var compile_pb = require('./compile_pb.js');
var core_pb = require('./core_pb.js');
var upload_pb = require('./upload_pb.js');
var lib_pb = require('./lib_pb.js');

function serialize_arduino_BoardDetailsReq(arg) {
  if (!(arg instanceof board_pb.BoardDetailsReq)) {
    throw new Error('Expected argument of type arduino.BoardDetailsReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_BoardDetailsReq(buffer_arg) {
  return board_pb.BoardDetailsReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_BoardDetailsResp(arg) {
  if (!(arg instanceof board_pb.BoardDetailsResp)) {
    throw new Error('Expected argument of type arduino.BoardDetailsResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_BoardDetailsResp(buffer_arg) {
  return board_pb.BoardDetailsResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_BoardListReq(arg) {
  if (!(arg instanceof board_pb.BoardListReq)) {
    throw new Error('Expected argument of type arduino.BoardListReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_BoardListReq(buffer_arg) {
  return board_pb.BoardListReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_BoardListResp(arg) {
  if (!(arg instanceof board_pb.BoardListResp)) {
    throw new Error('Expected argument of type arduino.BoardListResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_BoardListResp(buffer_arg) {
  return board_pb.BoardListResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_CompileReq(arg) {
  if (!(arg instanceof compile_pb.CompileReq)) {
    throw new Error('Expected argument of type arduino.CompileReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_CompileReq(buffer_arg) {
  return compile_pb.CompileReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_CompileResp(arg) {
  if (!(arg instanceof compile_pb.CompileResp)) {
    throw new Error('Expected argument of type arduino.CompileResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_CompileResp(buffer_arg) {
  return compile_pb.CompileResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_DestroyReq(arg) {
  if (!(arg instanceof commands_pb.DestroyReq)) {
    throw new Error('Expected argument of type arduino.DestroyReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_DestroyReq(buffer_arg) {
  return commands_pb.DestroyReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_DestroyResp(arg) {
  if (!(arg instanceof commands_pb.DestroyResp)) {
    throw new Error('Expected argument of type arduino.DestroyResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_DestroyResp(buffer_arg) {
  return commands_pb.DestroyResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_InitReq(arg) {
  if (!(arg instanceof commands_pb.InitReq)) {
    throw new Error('Expected argument of type arduino.InitReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_InitReq(buffer_arg) {
  return commands_pb.InitReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_InitResp(arg) {
  if (!(arg instanceof commands_pb.InitResp)) {
    throw new Error('Expected argument of type arduino.InitResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_InitResp(buffer_arg) {
  return commands_pb.InitResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryDownloadReq(arg) {
  if (!(arg instanceof lib_pb.LibraryDownloadReq)) {
    throw new Error('Expected argument of type arduino.LibraryDownloadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryDownloadReq(buffer_arg) {
  return lib_pb.LibraryDownloadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryDownloadResp(arg) {
  if (!(arg instanceof lib_pb.LibraryDownloadResp)) {
    throw new Error('Expected argument of type arduino.LibraryDownloadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryDownloadResp(buffer_arg) {
  return lib_pb.LibraryDownloadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryInstallReq(arg) {
  if (!(arg instanceof lib_pb.LibraryInstallReq)) {
    throw new Error('Expected argument of type arduino.LibraryInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryInstallReq(buffer_arg) {
  return lib_pb.LibraryInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryInstallResp(arg) {
  if (!(arg instanceof lib_pb.LibraryInstallResp)) {
    throw new Error('Expected argument of type arduino.LibraryInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryInstallResp(buffer_arg) {
  return lib_pb.LibraryInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibrarySearchReq(arg) {
  if (!(arg instanceof lib_pb.LibrarySearchReq)) {
    throw new Error('Expected argument of type arduino.LibrarySearchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibrarySearchReq(buffer_arg) {
  return lib_pb.LibrarySearchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibrarySearchResp(arg) {
  if (!(arg instanceof lib_pb.LibrarySearchResp)) {
    throw new Error('Expected argument of type arduino.LibrarySearchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibrarySearchResp(buffer_arg) {
  return lib_pb.LibrarySearchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryUninstallReq(arg) {
  if (!(arg instanceof lib_pb.LibraryUninstallReq)) {
    throw new Error('Expected argument of type arduino.LibraryUninstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryUninstallReq(buffer_arg) {
  return lib_pb.LibraryUninstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryUninstallResp(arg) {
  if (!(arg instanceof lib_pb.LibraryUninstallResp)) {
    throw new Error('Expected argument of type arduino.LibraryUninstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryUninstallResp(buffer_arg) {
  return lib_pb.LibraryUninstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryUpgradeAllReq(arg) {
  if (!(arg instanceof lib_pb.LibraryUpgradeAllReq)) {
    throw new Error('Expected argument of type arduino.LibraryUpgradeAllReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryUpgradeAllReq(buffer_arg) {
  return lib_pb.LibraryUpgradeAllReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_LibraryUpgradeAllResp(arg) {
  if (!(arg instanceof lib_pb.LibraryUpgradeAllResp)) {
    throw new Error('Expected argument of type arduino.LibraryUpgradeAllResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_LibraryUpgradeAllResp(buffer_arg) {
  return lib_pb.LibraryUpgradeAllResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformDownloadReq(arg) {
  if (!(arg instanceof core_pb.PlatformDownloadReq)) {
    throw new Error('Expected argument of type arduino.PlatformDownloadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformDownloadReq(buffer_arg) {
  return core_pb.PlatformDownloadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformDownloadResp(arg) {
  if (!(arg instanceof core_pb.PlatformDownloadResp)) {
    throw new Error('Expected argument of type arduino.PlatformDownloadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformDownloadResp(buffer_arg) {
  return core_pb.PlatformDownloadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformInstallReq(arg) {
  if (!(arg instanceof core_pb.PlatformInstallReq)) {
    throw new Error('Expected argument of type arduino.PlatformInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformInstallReq(buffer_arg) {
  return core_pb.PlatformInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformInstallResp(arg) {
  if (!(arg instanceof core_pb.PlatformInstallResp)) {
    throw new Error('Expected argument of type arduino.PlatformInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformInstallResp(buffer_arg) {
  return core_pb.PlatformInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformListReq(arg) {
  if (!(arg instanceof core_pb.PlatformListReq)) {
    throw new Error('Expected argument of type arduino.PlatformListReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformListReq(buffer_arg) {
  return core_pb.PlatformListReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformListResp(arg) {
  if (!(arg instanceof core_pb.PlatformListResp)) {
    throw new Error('Expected argument of type arduino.PlatformListResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformListResp(buffer_arg) {
  return core_pb.PlatformListResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformSearchReq(arg) {
  if (!(arg instanceof core_pb.PlatformSearchReq)) {
    throw new Error('Expected argument of type arduino.PlatformSearchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformSearchReq(buffer_arg) {
  return core_pb.PlatformSearchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformSearchResp(arg) {
  if (!(arg instanceof core_pb.PlatformSearchResp)) {
    throw new Error('Expected argument of type arduino.PlatformSearchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformSearchResp(buffer_arg) {
  return core_pb.PlatformSearchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformUninstallReq(arg) {
  if (!(arg instanceof core_pb.PlatformUninstallReq)) {
    throw new Error('Expected argument of type arduino.PlatformUninstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformUninstallReq(buffer_arg) {
  return core_pb.PlatformUninstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformUninstallResp(arg) {
  if (!(arg instanceof core_pb.PlatformUninstallResp)) {
    throw new Error('Expected argument of type arduino.PlatformUninstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformUninstallResp(buffer_arg) {
  return core_pb.PlatformUninstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformUpgradeReq(arg) {
  if (!(arg instanceof core_pb.PlatformUpgradeReq)) {
    throw new Error('Expected argument of type arduino.PlatformUpgradeReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformUpgradeReq(buffer_arg) {
  return core_pb.PlatformUpgradeReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_PlatformUpgradeResp(arg) {
  if (!(arg instanceof core_pb.PlatformUpgradeResp)) {
    throw new Error('Expected argument of type arduino.PlatformUpgradeResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_PlatformUpgradeResp(buffer_arg) {
  return core_pb.PlatformUpgradeResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_RescanReq(arg) {
  if (!(arg instanceof commands_pb.RescanReq)) {
    throw new Error('Expected argument of type arduino.RescanReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_RescanReq(buffer_arg) {
  return commands_pb.RescanReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_RescanResp(arg) {
  if (!(arg instanceof commands_pb.RescanResp)) {
    throw new Error('Expected argument of type arduino.RescanResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_RescanResp(buffer_arg) {
  return commands_pb.RescanResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_UpdateIndexReq(arg) {
  if (!(arg instanceof commands_pb.UpdateIndexReq)) {
    throw new Error('Expected argument of type arduino.UpdateIndexReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_UpdateIndexReq(buffer_arg) {
  return commands_pb.UpdateIndexReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_UpdateIndexResp(arg) {
  if (!(arg instanceof commands_pb.UpdateIndexResp)) {
    throw new Error('Expected argument of type arduino.UpdateIndexResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_UpdateIndexResp(buffer_arg) {
  return commands_pb.UpdateIndexResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_UploadReq(arg) {
  if (!(arg instanceof upload_pb.UploadReq)) {
    throw new Error('Expected argument of type arduino.UploadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_UploadReq(buffer_arg) {
  return upload_pb.UploadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_arduino_UploadResp(arg) {
  if (!(arg instanceof upload_pb.UploadResp)) {
    throw new Error('Expected argument of type arduino.UploadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_arduino_UploadResp(buffer_arg) {
  return upload_pb.UploadResp.deserializeBinary(new Uint8Array(buffer_arg));
}


// The main Arduino Platform Service
var ArduinoCoreService = exports.ArduinoCoreService = {
  // Start a new instance of the Arduino Core Service
  init: {
    path: '/arduino.ArduinoCore/Init',
    requestStream: false,
    responseStream: false,
    requestType: commands_pb.InitReq,
    responseType: commands_pb.InitResp,
    requestSerialize: serialize_arduino_InitReq,
    requestDeserialize: deserialize_arduino_InitReq,
    responseSerialize: serialize_arduino_InitResp,
    responseDeserialize: deserialize_arduino_InitResp,
  },
  // Destroy an instance of the Arduino Core Service
  destroy: {
    path: '/arduino.ArduinoCore/Destroy',
    requestStream: false,
    responseStream: false,
    requestType: commands_pb.DestroyReq,
    responseType: commands_pb.DestroyResp,
    requestSerialize: serialize_arduino_DestroyReq,
    requestDeserialize: deserialize_arduino_DestroyReq,
    responseSerialize: serialize_arduino_DestroyResp,
    responseDeserialize: deserialize_arduino_DestroyResp,
  },
  // Rescan instance of the Arduino Core Service
  rescan: {
    path: '/arduino.ArduinoCore/Rescan',
    requestStream: false,
    responseStream: false,
    requestType: commands_pb.RescanReq,
    responseType: commands_pb.RescanResp,
    requestSerialize: serialize_arduino_RescanReq,
    requestDeserialize: deserialize_arduino_RescanReq,
    responseSerialize: serialize_arduino_RescanResp,
    responseDeserialize: deserialize_arduino_RescanResp,
  },
  // Update package index of the Arduino Core Service
  updateIndex: {
    path: '/arduino.ArduinoCore/UpdateIndex',
    requestStream: false,
    responseStream: true,
    requestType: commands_pb.UpdateIndexReq,
    responseType: commands_pb.UpdateIndexResp,
    requestSerialize: serialize_arduino_UpdateIndexReq,
    requestDeserialize: deserialize_arduino_UpdateIndexReq,
    responseSerialize: serialize_arduino_UpdateIndexResp,
    responseDeserialize: deserialize_arduino_UpdateIndexResp,
  },
  // BOARD COMMANDS
  // --------------
  //
  boardList: {
    path: '/arduino.ArduinoCore/BoardList',
    requestStream: false,
    responseStream: false,
    requestType: board_pb.BoardListReq,
    responseType: board_pb.BoardListResp,
    requestSerialize: serialize_arduino_BoardListReq,
    requestDeserialize: deserialize_arduino_BoardListReq,
    responseSerialize: serialize_arduino_BoardListResp,
    responseDeserialize: deserialize_arduino_BoardListResp,
  },
  // Requests details about a board
  boardDetails: {
    path: '/arduino.ArduinoCore/BoardDetails',
    requestStream: false,
    responseStream: false,
    requestType: board_pb.BoardDetailsReq,
    responseType: board_pb.BoardDetailsResp,
    requestSerialize: serialize_arduino_BoardDetailsReq,
    requestDeserialize: deserialize_arduino_BoardDetailsReq,
    responseSerialize: serialize_arduino_BoardDetailsResp,
    responseDeserialize: deserialize_arduino_BoardDetailsResp,
  },
  compile: {
    path: '/arduino.ArduinoCore/Compile',
    requestStream: false,
    responseStream: true,
    requestType: compile_pb.CompileReq,
    responseType: compile_pb.CompileResp,
    requestSerialize: serialize_arduino_CompileReq,
    requestDeserialize: deserialize_arduino_CompileReq,
    responseSerialize: serialize_arduino_CompileResp,
    responseDeserialize: deserialize_arduino_CompileResp,
  },
  platformInstall: {
    path: '/arduino.ArduinoCore/PlatformInstall',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PlatformInstallReq,
    responseType: core_pb.PlatformInstallResp,
    requestSerialize: serialize_arduino_PlatformInstallReq,
    requestDeserialize: deserialize_arduino_PlatformInstallReq,
    responseSerialize: serialize_arduino_PlatformInstallResp,
    responseDeserialize: deserialize_arduino_PlatformInstallResp,
  },
  platformDownload: {
    path: '/arduino.ArduinoCore/PlatformDownload',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PlatformDownloadReq,
    responseType: core_pb.PlatformDownloadResp,
    requestSerialize: serialize_arduino_PlatformDownloadReq,
    requestDeserialize: deserialize_arduino_PlatformDownloadReq,
    responseSerialize: serialize_arduino_PlatformDownloadResp,
    responseDeserialize: deserialize_arduino_PlatformDownloadResp,
  },
  platformUninstall: {
    path: '/arduino.ArduinoCore/PlatformUninstall',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PlatformUninstallReq,
    responseType: core_pb.PlatformUninstallResp,
    requestSerialize: serialize_arduino_PlatformUninstallReq,
    requestDeserialize: deserialize_arduino_PlatformUninstallReq,
    responseSerialize: serialize_arduino_PlatformUninstallResp,
    responseDeserialize: deserialize_arduino_PlatformUninstallResp,
  },
  platformUpgrade: {
    path: '/arduino.ArduinoCore/PlatformUpgrade',
    requestStream: false,
    responseStream: true,
    requestType: core_pb.PlatformUpgradeReq,
    responseType: core_pb.PlatformUpgradeResp,
    requestSerialize: serialize_arduino_PlatformUpgradeReq,
    requestDeserialize: deserialize_arduino_PlatformUpgradeReq,
    responseSerialize: serialize_arduino_PlatformUpgradeResp,
    responseDeserialize: deserialize_arduino_PlatformUpgradeResp,
  },
  upload: {
    path: '/arduino.ArduinoCore/Upload',
    requestStream: false,
    responseStream: true,
    requestType: upload_pb.UploadReq,
    responseType: upload_pb.UploadResp,
    requestSerialize: serialize_arduino_UploadReq,
    requestDeserialize: deserialize_arduino_UploadReq,
    responseSerialize: serialize_arduino_UploadResp,
    responseDeserialize: deserialize_arduino_UploadResp,
  },
  platformSearch: {
    path: '/arduino.ArduinoCore/PlatformSearch',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.PlatformSearchReq,
    responseType: core_pb.PlatformSearchResp,
    requestSerialize: serialize_arduino_PlatformSearchReq,
    requestDeserialize: deserialize_arduino_PlatformSearchReq,
    responseSerialize: serialize_arduino_PlatformSearchResp,
    responseDeserialize: deserialize_arduino_PlatformSearchResp,
  },
  platformList: {
    path: '/arduino.ArduinoCore/PlatformList',
    requestStream: false,
    responseStream: false,
    requestType: core_pb.PlatformListReq,
    responseType: core_pb.PlatformListResp,
    requestSerialize: serialize_arduino_PlatformListReq,
    requestDeserialize: deserialize_arduino_PlatformListReq,
    responseSerialize: serialize_arduino_PlatformListResp,
    responseDeserialize: deserialize_arduino_PlatformListResp,
  },
  libraryDownload: {
    path: '/arduino.ArduinoCore/LibraryDownload',
    requestStream: false,
    responseStream: true,
    requestType: lib_pb.LibraryDownloadReq,
    responseType: lib_pb.LibraryDownloadResp,
    requestSerialize: serialize_arduino_LibraryDownloadReq,
    requestDeserialize: deserialize_arduino_LibraryDownloadReq,
    responseSerialize: serialize_arduino_LibraryDownloadResp,
    responseDeserialize: deserialize_arduino_LibraryDownloadResp,
  },
  libraryInstall: {
    path: '/arduino.ArduinoCore/LibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: lib_pb.LibraryInstallReq,
    responseType: lib_pb.LibraryInstallResp,
    requestSerialize: serialize_arduino_LibraryInstallReq,
    requestDeserialize: deserialize_arduino_LibraryInstallReq,
    responseSerialize: serialize_arduino_LibraryInstallResp,
    responseDeserialize: deserialize_arduino_LibraryInstallResp,
  },
  libraryUninstall: {
    path: '/arduino.ArduinoCore/LibraryUninstall',
    requestStream: false,
    responseStream: true,
    requestType: lib_pb.LibraryUninstallReq,
    responseType: lib_pb.LibraryUninstallResp,
    requestSerialize: serialize_arduino_LibraryUninstallReq,
    requestDeserialize: deserialize_arduino_LibraryUninstallReq,
    responseSerialize: serialize_arduino_LibraryUninstallResp,
    responseDeserialize: deserialize_arduino_LibraryUninstallResp,
  },
  libraryUpgradeAll: {
    path: '/arduino.ArduinoCore/LibraryUpgradeAll',
    requestStream: false,
    responseStream: true,
    requestType: lib_pb.LibraryUpgradeAllReq,
    responseType: lib_pb.LibraryUpgradeAllResp,
    requestSerialize: serialize_arduino_LibraryUpgradeAllReq,
    requestDeserialize: deserialize_arduino_LibraryUpgradeAllReq,
    responseSerialize: serialize_arduino_LibraryUpgradeAllResp,
    responseDeserialize: deserialize_arduino_LibraryUpgradeAllResp,
  },
  librarySearch: {
    path: '/arduino.ArduinoCore/LibrarySearch',
    requestStream: false,
    responseStream: false,
    requestType: lib_pb.LibrarySearchReq,
    responseType: lib_pb.LibrarySearchResp,
    requestSerialize: serialize_arduino_LibrarySearchReq,
    requestDeserialize: deserialize_arduino_LibrarySearchReq,
    responseSerialize: serialize_arduino_LibrarySearchResp,
    responseDeserialize: deserialize_arduino_LibrarySearchResp,
  },
};

exports.ArduinoCoreClient = grpc.makeGenericClientConstructor(ArduinoCoreService);
// BOOTSTRAP COMMANDS
// -------------------
