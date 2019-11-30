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
var grpc = require('@grpc/grpc-js');
var commands_commands_pb = require('../commands/commands_pb.js');
var commands_common_pb = require('../commands/common_pb.js');
var commands_board_pb = require('../commands/board_pb.js');
var commands_compile_pb = require('../commands/compile_pb.js');
var commands_core_pb = require('../commands/core_pb.js');
var commands_upload_pb = require('../commands/upload_pb.js');
var commands_lib_pb = require('../commands/lib_pb.js');

function serialize_cc_arduino_cli_commands_BoardAttachReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardAttachReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardAttachReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardAttachReq(buffer_arg) {
  return commands_board_pb.BoardAttachReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardAttachResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardAttachResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardAttachResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardAttachResp(buffer_arg) {
  return commands_board_pb.BoardAttachResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardDetailsReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardDetailsReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardDetailsReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardDetailsReq(buffer_arg) {
  return commands_board_pb.BoardDetailsReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardDetailsResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardDetailsResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardDetailsResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardDetailsResp(buffer_arg) {
  return commands_board_pb.BoardDetailsResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardListAllReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardListAllReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListAllReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListAllReq(buffer_arg) {
  return commands_board_pb.BoardListAllReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardListAllResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardListAllResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListAllResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListAllResp(buffer_arg) {
  return commands_board_pb.BoardListAllResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardListReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardListReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListReq(buffer_arg) {
  return commands_board_pb.BoardListReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardListResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardListResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListResp(buffer_arg) {
  return commands_board_pb.BoardListResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_CompileReq(arg) {
  if (!(arg instanceof commands_compile_pb.CompileReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.CompileReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_CompileReq(buffer_arg) {
  return commands_compile_pb.CompileReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_CompileResp(arg) {
  if (!(arg instanceof commands_compile_pb.CompileResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.CompileResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_CompileResp(buffer_arg) {
  return commands_compile_pb.CompileResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_DestroyReq(arg) {
  if (!(arg instanceof commands_commands_pb.DestroyReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.DestroyReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_DestroyReq(buffer_arg) {
  return commands_commands_pb.DestroyReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_DestroyResp(arg) {
  if (!(arg instanceof commands_commands_pb.DestroyResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.DestroyResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_DestroyResp(buffer_arg) {
  return commands_commands_pb.DestroyResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_InitReq(arg) {
  if (!(arg instanceof commands_commands_pb.InitReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.InitReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_InitReq(buffer_arg) {
  return commands_commands_pb.InitReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_InitResp(arg) {
  if (!(arg instanceof commands_commands_pb.InitResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.InitResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_InitResp(buffer_arg) {
  return commands_commands_pb.InitResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryDownloadReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryDownloadReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryDownloadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryDownloadReq(buffer_arg) {
  return commands_lib_pb.LibraryDownloadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryDownloadResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryDownloadResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryDownloadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryDownloadResp(buffer_arg) {
  return commands_lib_pb.LibraryDownloadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryInstallReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryInstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryInstallReq(buffer_arg) {
  return commands_lib_pb.LibraryInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryInstallResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryInstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryInstallResp(buffer_arg) {
  return commands_lib_pb.LibraryInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryListReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryListReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryListReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryListReq(buffer_arg) {
  return commands_lib_pb.LibraryListReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryListResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryListResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryListResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryListResp(buffer_arg) {
  return commands_lib_pb.LibraryListResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryResolveDependenciesReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryResolveDependenciesReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryResolveDependenciesReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryResolveDependenciesReq(buffer_arg) {
  return commands_lib_pb.LibraryResolveDependenciesReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryResolveDependenciesResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryResolveDependenciesResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryResolveDependenciesResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryResolveDependenciesResp(buffer_arg) {
  return commands_lib_pb.LibraryResolveDependenciesResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibrarySearchReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibrarySearchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibrarySearchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibrarySearchReq(buffer_arg) {
  return commands_lib_pb.LibrarySearchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibrarySearchResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibrarySearchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibrarySearchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibrarySearchResp(buffer_arg) {
  return commands_lib_pb.LibrarySearchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryUninstallReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryUninstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryUninstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryUninstallReq(buffer_arg) {
  return commands_lib_pb.LibraryUninstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryUninstallResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryUninstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryUninstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryUninstallResp(buffer_arg) {
  return commands_lib_pb.LibraryUninstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryUpgradeAllReq(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryUpgradeAllReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryUpgradeAllReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryUpgradeAllReq(buffer_arg) {
  return commands_lib_pb.LibraryUpgradeAllReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LibraryUpgradeAllResp(arg) {
  if (!(arg instanceof commands_lib_pb.LibraryUpgradeAllResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LibraryUpgradeAllResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LibraryUpgradeAllResp(buffer_arg) {
  return commands_lib_pb.LibraryUpgradeAllResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformDownloadReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformDownloadReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformDownloadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformDownloadReq(buffer_arg) {
  return commands_core_pb.PlatformDownloadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformDownloadResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformDownloadResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformDownloadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformDownloadResp(buffer_arg) {
  return commands_core_pb.PlatformDownloadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformInstallReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformInstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformInstallReq(buffer_arg) {
  return commands_core_pb.PlatformInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformInstallResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformInstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformInstallResp(buffer_arg) {
  return commands_core_pb.PlatformInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformListReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformListReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformListReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformListReq(buffer_arg) {
  return commands_core_pb.PlatformListReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformListResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformListResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformListResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformListResp(buffer_arg) {
  return commands_core_pb.PlatformListResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformSearchReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformSearchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformSearchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformSearchReq(buffer_arg) {
  return commands_core_pb.PlatformSearchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformSearchResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformSearchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformSearchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformSearchResp(buffer_arg) {
  return commands_core_pb.PlatformSearchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformUninstallReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformUninstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformUninstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformUninstallReq(buffer_arg) {
  return commands_core_pb.PlatformUninstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformUninstallResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformUninstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformUninstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformUninstallResp(buffer_arg) {
  return commands_core_pb.PlatformUninstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformUpgradeReq(arg) {
  if (!(arg instanceof commands_core_pb.PlatformUpgradeReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformUpgradeReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformUpgradeReq(buffer_arg) {
  return commands_core_pb.PlatformUpgradeReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_PlatformUpgradeResp(arg) {
  if (!(arg instanceof commands_core_pb.PlatformUpgradeResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.PlatformUpgradeResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_PlatformUpgradeResp(buffer_arg) {
  return commands_core_pb.PlatformUpgradeResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_RescanReq(arg) {
  if (!(arg instanceof commands_commands_pb.RescanReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.RescanReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_RescanReq(buffer_arg) {
  return commands_commands_pb.RescanReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_RescanResp(arg) {
  if (!(arg instanceof commands_commands_pb.RescanResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.RescanResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_RescanResp(buffer_arg) {
  return commands_commands_pb.RescanResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpdateIndexReq(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateIndexReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateIndexReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateIndexReq(buffer_arg) {
  return commands_commands_pb.UpdateIndexReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpdateIndexResp(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateIndexResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateIndexResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateIndexResp(buffer_arg) {
  return commands_commands_pb.UpdateIndexResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpdateLibrariesIndexReq(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateLibrariesIndexReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateLibrariesIndexReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateLibrariesIndexReq(buffer_arg) {
  return commands_commands_pb.UpdateLibrariesIndexReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpdateLibrariesIndexResp(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateLibrariesIndexResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateLibrariesIndexResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateLibrariesIndexResp(buffer_arg) {
  return commands_commands_pb.UpdateLibrariesIndexResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UploadReq(arg) {
  if (!(arg instanceof commands_upload_pb.UploadReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UploadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UploadReq(buffer_arg) {
  return commands_upload_pb.UploadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UploadResp(arg) {
  if (!(arg instanceof commands_upload_pb.UploadResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UploadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UploadResp(buffer_arg) {
  return commands_upload_pb.UploadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_VersionReq(arg) {
  if (!(arg instanceof commands_commands_pb.VersionReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.VersionReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_VersionReq(buffer_arg) {
  return commands_commands_pb.VersionReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_VersionResp(arg) {
  if (!(arg instanceof commands_commands_pb.VersionResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.VersionResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_VersionResp(buffer_arg) {
  return commands_commands_pb.VersionResp.deserializeBinary(new Uint8Array(buffer_arg));
}


// The main Arduino Platform Service
var ArduinoCoreService = exports.ArduinoCoreService = {
  // Start a new instance of the Arduino Core Service
  init: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Init',
    requestStream: false,
    responseStream: true,
    requestType: commands_commands_pb.InitReq,
    responseType: commands_commands_pb.InitResp,
    requestSerialize: serialize_cc_arduino_cli_commands_InitReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_InitReq,
    responseSerialize: serialize_cc_arduino_cli_commands_InitResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_InitResp,
  },
  // Destroy an instance of the Arduino Core Service
  destroy: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Destroy',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.DestroyReq,
    responseType: commands_commands_pb.DestroyResp,
    requestSerialize: serialize_cc_arduino_cli_commands_DestroyReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_DestroyReq,
    responseSerialize: serialize_cc_arduino_cli_commands_DestroyResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_DestroyResp,
  },
  // Rescan instance of the Arduino Core Service
  rescan: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Rescan',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.RescanReq,
    responseType: commands_commands_pb.RescanResp,
    requestSerialize: serialize_cc_arduino_cli_commands_RescanReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_RescanReq,
    responseSerialize: serialize_cc_arduino_cli_commands_RescanResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_RescanResp,
  },
  // Update package index of the Arduino Core Service
  updateIndex: {
    path: '/cc.arduino.cli.commands.ArduinoCore/UpdateIndex',
    requestStream: false,
    responseStream: true,
    requestType: commands_commands_pb.UpdateIndexReq,
    responseType: commands_commands_pb.UpdateIndexResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UpdateIndexReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UpdateIndexReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UpdateIndexResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UpdateIndexResp,
  },
  // Update libraries index
  updateLibrariesIndex: {
    path: '/cc.arduino.cli.commands.ArduinoCore/UpdateLibrariesIndex',
    requestStream: false,
    responseStream: true,
    requestType: commands_commands_pb.UpdateLibrariesIndexReq,
    responseType: commands_commands_pb.UpdateLibrariesIndexResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UpdateLibrariesIndexReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UpdateLibrariesIndexReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UpdateLibrariesIndexResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UpdateLibrariesIndexResp,
  },
  version: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Version',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.VersionReq,
    responseType: commands_commands_pb.VersionResp,
    requestSerialize: serialize_cc_arduino_cli_commands_VersionReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_VersionReq,
    responseSerialize: serialize_cc_arduino_cli_commands_VersionResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_VersionResp,
  },
  // BOARD COMMANDS
  // --------------
  //
  // Requests details about a board
  boardDetails: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardDetails',
    requestStream: false,
    responseStream: false,
    requestType: commands_board_pb.BoardDetailsReq,
    responseType: commands_board_pb.BoardDetailsResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardDetailsReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardDetailsReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardDetailsResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardDetailsResp,
  },
  boardAttach: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardAttach',
    requestStream: false,
    responseStream: true,
    requestType: commands_board_pb.BoardAttachReq,
    responseType: commands_board_pb.BoardAttachResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardAttachReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardAttachReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardAttachResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardAttachResp,
  },
  boardList: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardList',
    requestStream: false,
    responseStream: false,
    requestType: commands_board_pb.BoardListReq,
    responseType: commands_board_pb.BoardListResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardListReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardListReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardListResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardListResp,
  },
  boardListAll: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardListAll',
    requestStream: false,
    responseStream: false,
    requestType: commands_board_pb.BoardListAllReq,
    responseType: commands_board_pb.BoardListAllResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardListAllReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardListAllReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardListAllResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardListAllResp,
  },
  compile: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Compile',
    requestStream: false,
    responseStream: true,
    requestType: commands_compile_pb.CompileReq,
    responseType: commands_compile_pb.CompileResp,
    requestSerialize: serialize_cc_arduino_cli_commands_CompileReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_CompileReq,
    responseSerialize: serialize_cc_arduino_cli_commands_CompileResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_CompileResp,
  },
  platformInstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformInstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_core_pb.PlatformInstallReq,
    responseType: commands_core_pb.PlatformInstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformInstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformInstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformInstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformInstallResp,
  },
  platformDownload: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformDownload',
    requestStream: false,
    responseStream: true,
    requestType: commands_core_pb.PlatformDownloadReq,
    responseType: commands_core_pb.PlatformDownloadResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformDownloadReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformDownloadReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformDownloadResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformDownloadResp,
  },
  platformUninstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformUninstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_core_pb.PlatformUninstallReq,
    responseType: commands_core_pb.PlatformUninstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformUninstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformUninstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformUninstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformUninstallResp,
  },
  platformUpgrade: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformUpgrade',
    requestStream: false,
    responseStream: true,
    requestType: commands_core_pb.PlatformUpgradeReq,
    responseType: commands_core_pb.PlatformUpgradeResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformUpgradeReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformUpgradeReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformUpgradeResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformUpgradeResp,
  },
  upload: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Upload',
    requestStream: false,
    responseStream: true,
    requestType: commands_upload_pb.UploadReq,
    responseType: commands_upload_pb.UploadResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UploadReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UploadReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UploadResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UploadResp,
  },
  platformSearch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformSearch',
    requestStream: false,
    responseStream: false,
    requestType: commands_core_pb.PlatformSearchReq,
    responseType: commands_core_pb.PlatformSearchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformSearchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformSearchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformSearchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformSearchResp,
  },
  platformList: {
    path: '/cc.arduino.cli.commands.ArduinoCore/PlatformList',
    requestStream: false,
    responseStream: false,
    requestType: commands_core_pb.PlatformListReq,
    responseType: commands_core_pb.PlatformListResp,
    requestSerialize: serialize_cc_arduino_cli_commands_PlatformListReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_PlatformListReq,
    responseSerialize: serialize_cc_arduino_cli_commands_PlatformListResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_PlatformListResp,
  },
  libraryDownload: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryDownload',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.LibraryDownloadReq,
    responseType: commands_lib_pb.LibraryDownloadResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryDownloadReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryDownloadReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryDownloadResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryDownloadResp,
  },
  libraryInstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.LibraryInstallReq,
    responseType: commands_lib_pb.LibraryInstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryInstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryInstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryInstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryInstallResp,
  },
  libraryUninstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryUninstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.LibraryUninstallReq,
    responseType: commands_lib_pb.LibraryUninstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryUninstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryUninstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryUninstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryUninstallResp,
  },
  libraryUpgradeAll: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryUpgradeAll',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.LibraryUpgradeAllReq,
    responseType: commands_lib_pb.LibraryUpgradeAllResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryUpgradeAllReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryUpgradeAllReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryUpgradeAllResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryUpgradeAllResp,
  },
  libraryResolveDependencies: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryResolveDependencies',
    requestStream: false,
    responseStream: false,
    requestType: commands_lib_pb.LibraryResolveDependenciesReq,
    responseType: commands_lib_pb.LibraryResolveDependenciesResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryResolveDependenciesReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryResolveDependenciesReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryResolveDependenciesResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryResolveDependenciesResp,
  },
  librarySearch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibrarySearch',
    requestStream: false,
    responseStream: false,
    requestType: commands_lib_pb.LibrarySearchReq,
    responseType: commands_lib_pb.LibrarySearchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibrarySearchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibrarySearchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibrarySearchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibrarySearchResp,
  },
  libraryList: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LibraryList',
    requestStream: false,
    responseStream: false,
    requestType: commands_lib_pb.LibraryListReq,
    responseType: commands_lib_pb.LibraryListResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LibraryListReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LibraryListReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LibraryListResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LibraryListResp,
  },
};

exports.ArduinoCoreClient = grpc.makeGenericClientConstructor(ArduinoCoreService);
// BOOTSTRAP COMMANDS
// -------------------
