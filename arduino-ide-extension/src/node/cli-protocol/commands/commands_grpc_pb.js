// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// This file is part of arduino-cli.
//
// Copyright 2020 ARDUINO SA (http://www.arduino.cc/)
//
// This software is released under the GNU General Public License version 3,
// which covers the main part of arduino-cli.
// The terms of this license can be found at:
// https://www.gnu.org/licenses/gpl-3.0.en.html
//
// You can be released from the requirements of the above licenses by purchasing
// a commercial license. Buying such a license is mandatory if you want to
// modify or otherwise use the software for commercial activities involving the
// Arduino software without disclosing the source code of your own applications.
// To purchase a commercial license, send an email to license@arduino.cc.
//
'use strict';
var commands_commands_pb = require('../commands/commands_pb.js');
var commands_common_pb = require('../commands/common_pb.js');
var commands_board_pb = require('../commands/board_pb.js');
var commands_compile_pb = require('../commands/compile_pb.js');
var commands_core_pb = require('../commands/core_pb.js');
var commands_upload_pb = require('../commands/upload_pb.js');
var commands_lib_pb = require('../commands/lib_pb.js');

function serialize_cc_arduino_cli_commands_ArchiveSketchReq(arg) {
  if (!(arg instanceof commands_commands_pb.ArchiveSketchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ArchiveSketchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ArchiveSketchReq(buffer_arg) {
  return commands_commands_pb.ArchiveSketchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_ArchiveSketchResp(arg) {
  if (!(arg instanceof commands_commands_pb.ArchiveSketchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ArchiveSketchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ArchiveSketchResp(buffer_arg) {
  return commands_commands_pb.ArchiveSketchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

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

function serialize_cc_arduino_cli_commands_BoardListWatchReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardListWatchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListWatchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListWatchReq(buffer_arg) {
  return commands_board_pb.BoardListWatchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardListWatchResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardListWatchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardListWatchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardListWatchResp(buffer_arg) {
  return commands_board_pb.BoardListWatchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardSearchReq(arg) {
  if (!(arg instanceof commands_board_pb.BoardSearchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardSearchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardSearchReq(buffer_arg) {
  return commands_board_pb.BoardSearchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BoardSearchResp(arg) {
  if (!(arg instanceof commands_board_pb.BoardSearchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BoardSearchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BoardSearchResp(buffer_arg) {
  return commands_board_pb.BoardSearchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BurnBootloaderReq(arg) {
  if (!(arg instanceof commands_upload_pb.BurnBootloaderReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BurnBootloaderReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BurnBootloaderReq(buffer_arg) {
  return commands_upload_pb.BurnBootloaderReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_BurnBootloaderResp(arg) {
  if (!(arg instanceof commands_upload_pb.BurnBootloaderResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.BurnBootloaderResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_BurnBootloaderResp(buffer_arg) {
  return commands_upload_pb.BurnBootloaderResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_GitLibraryInstallReq(arg) {
  if (!(arg instanceof commands_lib_pb.GitLibraryInstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.GitLibraryInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_GitLibraryInstallReq(buffer_arg) {
  return commands_lib_pb.GitLibraryInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_GitLibraryInstallResp(arg) {
  if (!(arg instanceof commands_lib_pb.GitLibraryInstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.GitLibraryInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_GitLibraryInstallResp(buffer_arg) {
  return commands_lib_pb.GitLibraryInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadReq(arg) {
  if (!(arg instanceof commands_upload_pb.ListProgrammersAvailableForUploadReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ListProgrammersAvailableForUploadReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadReq(buffer_arg) {
  return commands_upload_pb.ListProgrammersAvailableForUploadReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadResp(arg) {
  if (!(arg instanceof commands_upload_pb.ListProgrammersAvailableForUploadResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ListProgrammersAvailableForUploadResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadResp(buffer_arg) {
  return commands_upload_pb.ListProgrammersAvailableForUploadResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LoadSketchReq(arg) {
  if (!(arg instanceof commands_commands_pb.LoadSketchReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LoadSketchReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LoadSketchReq(buffer_arg) {
  return commands_commands_pb.LoadSketchReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_LoadSketchResp(arg) {
  if (!(arg instanceof commands_commands_pb.LoadSketchResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.LoadSketchResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_LoadSketchResp(buffer_arg) {
  return commands_commands_pb.LoadSketchResp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_OutdatedReq(arg) {
  if (!(arg instanceof commands_commands_pb.OutdatedReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.OutdatedReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_OutdatedReq(buffer_arg) {
  return commands_commands_pb.OutdatedReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_OutdatedResp(arg) {
  if (!(arg instanceof commands_commands_pb.OutdatedResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.OutdatedResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_OutdatedResp(buffer_arg) {
  return commands_commands_pb.OutdatedResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexReq(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateCoreLibrariesIndexReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateCoreLibrariesIndexReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexReq(buffer_arg) {
  return commands_commands_pb.UpdateCoreLibrariesIndexReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexResp(arg) {
  if (!(arg instanceof commands_commands_pb.UpdateCoreLibrariesIndexResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpdateCoreLibrariesIndexResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexResp(buffer_arg) {
  return commands_commands_pb.UpdateCoreLibrariesIndexResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_UpgradeReq(arg) {
  if (!(arg instanceof commands_commands_pb.UpgradeReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpgradeReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpgradeReq(buffer_arg) {
  return commands_commands_pb.UpgradeReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UpgradeResp(arg) {
  if (!(arg instanceof commands_commands_pb.UpgradeResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UpgradeResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UpgradeResp(buffer_arg) {
  return commands_commands_pb.UpgradeResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_UploadUsingProgrammerReq(arg) {
  if (!(arg instanceof commands_upload_pb.UploadUsingProgrammerReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UploadUsingProgrammerReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UploadUsingProgrammerReq(buffer_arg) {
  return commands_upload_pb.UploadUsingProgrammerReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_UploadUsingProgrammerResp(arg) {
  if (!(arg instanceof commands_upload_pb.UploadUsingProgrammerResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.UploadUsingProgrammerResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_UploadUsingProgrammerResp(buffer_arg) {
  return commands_upload_pb.UploadUsingProgrammerResp.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_cc_arduino_cli_commands_ZipLibraryInstallReq(arg) {
  if (!(arg instanceof commands_lib_pb.ZipLibraryInstallReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ZipLibraryInstallReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ZipLibraryInstallReq(buffer_arg) {
  return commands_lib_pb.ZipLibraryInstallReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_ZipLibraryInstallResp(arg) {
  if (!(arg instanceof commands_lib_pb.ZipLibraryInstallResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.ZipLibraryInstallResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_ZipLibraryInstallResp(buffer_arg) {
  return commands_lib_pb.ZipLibraryInstallResp.deserializeBinary(new Uint8Array(buffer_arg));
}


// The main Arduino Platform Service
var ArduinoCoreService = exports['cc.arduino.cli.commands.ArduinoCore'] = {
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
  // Update packages indexes for both Cores and Libraries
updateCoreLibrariesIndex: {
    path: '/cc.arduino.cli.commands.ArduinoCore/UpdateCoreLibrariesIndex',
    requestStream: false,
    responseStream: true,
    requestType: commands_commands_pb.UpdateCoreLibrariesIndexReq,
    responseType: commands_commands_pb.UpdateCoreLibrariesIndexResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UpdateCoreLibrariesIndexResp,
  },
  // Outdated returns a message with a list of outdated Cores and Libraries
outdated: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Outdated',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.OutdatedReq,
    responseType: commands_commands_pb.OutdatedResp,
    requestSerialize: serialize_cc_arduino_cli_commands_OutdatedReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_OutdatedReq,
    responseSerialize: serialize_cc_arduino_cli_commands_OutdatedResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_OutdatedResp,
  },
  // Upgrade both Cores and Libraries
upgrade: {
    path: '/cc.arduino.cli.commands.ArduinoCore/Upgrade',
    requestStream: false,
    responseStream: true,
    requestType: commands_commands_pb.UpgradeReq,
    responseType: commands_commands_pb.UpgradeResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UpgradeReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UpgradeReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UpgradeResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UpgradeResp,
  },
  // Get the version of Arduino CLI in use.
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
  // Returns all files composing a Sketch
loadSketch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/LoadSketch',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.LoadSketchReq,
    responseType: commands_commands_pb.LoadSketchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_LoadSketchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_LoadSketchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_LoadSketchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_LoadSketchResp,
  },
  // Creates a zip file containing all files of specified Sketch
archiveSketch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/ArchiveSketch',
    requestStream: false,
    responseStream: false,
    requestType: commands_commands_pb.ArchiveSketchReq,
    responseType: commands_commands_pb.ArchiveSketchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_ArchiveSketchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_ArchiveSketchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_ArchiveSketchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_ArchiveSketchResp,
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
  // Attach a board to a sketch. When the `fqbn` field of a request is not
// provided, the FQBN of the attached board will be used.
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
  // List the boards currently connected to the computer.
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
  // List all the boards provided by installed platforms.
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
  // Search boards in installed and not installed Platforms.
boardSearch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardSearch',
    requestStream: false,
    responseStream: false,
    requestType: commands_board_pb.BoardSearchReq,
    responseType: commands_board_pb.BoardSearchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardSearchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardSearchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardSearchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardSearchResp,
  },
  // List boards connection and disconnected events.
boardListWatch: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BoardListWatch',
    requestStream: true,
    responseStream: true,
    requestType: commands_board_pb.BoardListWatchReq,
    responseType: commands_board_pb.BoardListWatchResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BoardListWatchReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BoardListWatchReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BoardListWatchResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BoardListWatchResp,
  },
  // Compile an Arduino sketch.
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
  // Download and install a platform and its tool dependencies.
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
  // Download a platform and its tool dependencies to the `staging/packages`
// subdirectory of the data directory.
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
  // Uninstall a platform as well as its tool dependencies that are not used by
// other installed platforms.
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
  // Upgrade an installed platform to the latest version.
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
  // Upload a compiled sketch to a board.
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
  // Upload a compiled sketch to a board using a programmer.
uploadUsingProgrammer: {
    path: '/cc.arduino.cli.commands.ArduinoCore/UploadUsingProgrammer',
    requestStream: false,
    responseStream: true,
    requestType: commands_upload_pb.UploadUsingProgrammerReq,
    responseType: commands_upload_pb.UploadUsingProgrammerResp,
    requestSerialize: serialize_cc_arduino_cli_commands_UploadUsingProgrammerReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_UploadUsingProgrammerReq,
    responseSerialize: serialize_cc_arduino_cli_commands_UploadUsingProgrammerResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_UploadUsingProgrammerResp,
  },
  // List programmers available for a board.
listProgrammersAvailableForUpload: {
    path: '/cc.arduino.cli.commands.ArduinoCore/ListProgrammersAvailableForUpload',
    requestStream: false,
    responseStream: false,
    requestType: commands_upload_pb.ListProgrammersAvailableForUploadReq,
    responseType: commands_upload_pb.ListProgrammersAvailableForUploadResp,
    requestSerialize: serialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadReq,
    responseSerialize: serialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_ListProgrammersAvailableForUploadResp,
  },
  // Burn bootloader to a board.
burnBootloader: {
    path: '/cc.arduino.cli.commands.ArduinoCore/BurnBootloader',
    requestStream: false,
    responseStream: true,
    requestType: commands_upload_pb.BurnBootloaderReq,
    responseType: commands_upload_pb.BurnBootloaderResp,
    requestSerialize: serialize_cc_arduino_cli_commands_BurnBootloaderReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_BurnBootloaderReq,
    responseSerialize: serialize_cc_arduino_cli_commands_BurnBootloaderResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_BurnBootloaderResp,
  },
  // Search for a platform in the platforms indexes.
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
  // List all installed platforms.
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
  // Download the archive file of an Arduino library in the libraries index to
// the staging directory.
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
  // Download and install an Arduino library from the libraries index.
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
  // Install a library from a Zip File
zipLibraryInstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/ZipLibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.ZipLibraryInstallReq,
    responseType: commands_lib_pb.ZipLibraryInstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_ZipLibraryInstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_ZipLibraryInstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_ZipLibraryInstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_ZipLibraryInstallResp,
  },
  // Download and install a library from a git url
gitLibraryInstall: {
    path: '/cc.arduino.cli.commands.ArduinoCore/GitLibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: commands_lib_pb.GitLibraryInstallReq,
    responseType: commands_lib_pb.GitLibraryInstallResp,
    requestSerialize: serialize_cc_arduino_cli_commands_GitLibraryInstallReq,
    requestDeserialize: deserialize_cc_arduino_cli_commands_GitLibraryInstallReq,
    responseSerialize: serialize_cc_arduino_cli_commands_GitLibraryInstallResp,
    responseDeserialize: deserialize_cc_arduino_cli_commands_GitLibraryInstallResp,
  },
  // Uninstall an Arduino library.
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
  // Upgrade all installed Arduino libraries to the newest version available.
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
  // List the recursive dependencies of a library, as defined by the `depends`
// field of the library.properties files.
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
  // Search the Arduino libraries index for libraries.
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
  // List the installed libraries.
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

// BOOTSTRAP COMMANDS
// -------------------
