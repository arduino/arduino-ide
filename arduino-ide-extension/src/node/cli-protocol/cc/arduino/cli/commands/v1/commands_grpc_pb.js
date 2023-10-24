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
var cc_arduino_cli_commands_v1_commands_pb = require('../../../../../cc/arduino/cli/commands/v1/commands_pb.js');
var google_rpc_status_pb = require('../../../../../google/rpc/status_pb.js');
var cc_arduino_cli_commands_v1_common_pb = require('../../../../../cc/arduino/cli/commands/v1/common_pb.js');
var cc_arduino_cli_commands_v1_board_pb = require('../../../../../cc/arduino/cli/commands/v1/board_pb.js');
var cc_arduino_cli_commands_v1_compile_pb = require('../../../../../cc/arduino/cli/commands/v1/compile_pb.js');
var cc_arduino_cli_commands_v1_core_pb = require('../../../../../cc/arduino/cli/commands/v1/core_pb.js');
var cc_arduino_cli_commands_v1_debug_pb = require('../../../../../cc/arduino/cli/commands/v1/debug_pb.js');
var cc_arduino_cli_commands_v1_monitor_pb = require('../../../../../cc/arduino/cli/commands/v1/monitor_pb.js');
var cc_arduino_cli_commands_v1_upload_pb = require('../../../../../cc/arduino/cli/commands/v1/upload_pb.js');
var cc_arduino_cli_commands_v1_lib_pb = require('../../../../../cc/arduino/cli/commands/v1/lib_pb.js');

function serialize_cc_arduino_cli_commands_v1_ArchiveSketchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ArchiveSketchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ArchiveSketchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_ArchiveSketchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ArchiveSketchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ArchiveSketchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardDetailsRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardDetailsRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardDetailsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardDetailsRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardDetailsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardDetailsResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardDetailsResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardDetailsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardDetailsResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardDetailsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListAllRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListAllRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListAllRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListAllResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListAllResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListAllResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListAllResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListAllResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListWatchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListWatchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListWatchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListWatchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListWatchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardListWatchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardListWatchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardListWatchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardListWatchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardListWatchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardSearchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardSearchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardSearchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardSearchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardSearchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BoardSearchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_board_pb.BoardSearchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BoardSearchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BoardSearchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_board_pb.BoardSearchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BurnBootloaderRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BurnBootloaderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BurnBootloaderRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_BurnBootloaderResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.BurnBootloaderResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_BurnBootloaderResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_CompileRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_compile_pb.CompileRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.CompileRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_CompileRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_compile_pb.CompileRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_CompileResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_compile_pb.CompileResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.CompileResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_CompileResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_compile_pb.CompileResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_CreateRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.CreateRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.CreateRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_CreateRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.CreateRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_CreateResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.CreateResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.CreateResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_CreateResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.CreateResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_DebugRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_debug_pb.DebugRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.DebugRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_DebugRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_debug_pb.DebugRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_DebugResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_debug_pb.DebugResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.DebugResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_DebugResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_debug_pb.DebugResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_DestroyRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.DestroyRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.DestroyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_DestroyRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.DestroyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_DestroyResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.DestroyResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.DestroyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_DestroyResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.DestroyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.EnumerateMonitorPortSettingsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.EnumerateMonitorPortSettingsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_GetDebugConfigRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.GetDebugConfigRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_GetDebugConfigRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_GetDebugConfigResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.GetDebugConfigResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_GetDebugConfigResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_GitLibraryInstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.GitLibraryInstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_GitLibraryInstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_GitLibraryInstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.GitLibraryInstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_GitLibraryInstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_InitRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.InitRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.InitRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_InitRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.InitRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_InitResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.InitResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.InitResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_InitResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.InitResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryDownloadRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryDownloadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryDownloadRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryDownloadResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryDownloadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryDownloadResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryInstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryInstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryInstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryInstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryInstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryInstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryInstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryInstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryInstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryInstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryListRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryListRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryListRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryListResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryListResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryListResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryResolveDependenciesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryResolveDependenciesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibrarySearchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibrarySearchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibrarySearchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibrarySearchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibrarySearchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibrarySearchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibrarySearchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibrarySearchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibrarySearchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibrarySearchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUninstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUninstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUninstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUninstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUninstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUninstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUpgradeAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUpgradeAllResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUpgradeRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUpgradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LibraryUpgradeResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LibraryUpgradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ListProgrammersAvailableForUploadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ListProgrammersAvailableForUploadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LoadSketchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.LoadSketchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LoadSketchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LoadSketchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.LoadSketchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_LoadSketchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.LoadSketchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.LoadSketchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_LoadSketchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.LoadSketchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_MonitorRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_monitor_pb.MonitorRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.MonitorRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_MonitorRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_monitor_pb.MonitorRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_MonitorResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_monitor_pb.MonitorResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.MonitorResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_MonitorResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_monitor_pb.MonitorResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_NewSketchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.NewSketchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.NewSketchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_NewSketchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.NewSketchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_NewSketchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.NewSketchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.NewSketchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_NewSketchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.NewSketchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformDownloadRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformDownloadRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformDownloadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformDownloadRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformDownloadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformDownloadResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformDownloadResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformDownloadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformDownloadResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformDownloadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformInstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformInstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformInstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformInstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformInstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformInstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformInstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformInstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformInstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformInstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformListRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformListRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformListRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformListRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformListRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformListResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformListResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformListResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformListResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformListResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformSearchRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformSearchRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformSearchRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformSearchRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformSearchRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformSearchResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformSearchResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformSearchResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformSearchResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformSearchResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformUninstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformUninstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformUninstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformUninstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformUninstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformUninstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformUninstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformUninstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformUninstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformUninstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformUpgradeRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformUpgradeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformUpgradeRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_PlatformUpgradeResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.PlatformUpgradeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_PlatformUpgradeResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_SetSketchDefaultsRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.SetSketchDefaultsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_SetSketchDefaultsRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_SetSketchDefaultsResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.SetSketchDefaultsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_SetSketchDefaultsResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_SupportedUserFieldsRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.SupportedUserFieldsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_SupportedUserFieldsRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_SupportedUserFieldsResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.SupportedUserFieldsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_SupportedUserFieldsResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UpdateIndexRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.UpdateIndexRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UpdateIndexRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UpdateIndexRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.UpdateIndexRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UpdateIndexResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.UpdateIndexResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UpdateIndexResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UpdateIndexResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.UpdateIndexResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UploadRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.UploadRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UploadRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UploadRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.UploadRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UploadResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.UploadResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UploadResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UploadResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.UploadResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UploadUsingProgrammerRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.UploadUsingProgrammerResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_VersionRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.VersionRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.VersionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_VersionRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.VersionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_VersionResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_commands_pb.VersionResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.VersionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_VersionResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_commands_pb.VersionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_ZipLibraryInstallRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ZipLibraryInstallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ZipLibraryInstallRequest(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_commands_v1_ZipLibraryInstallResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.commands.v1.ZipLibraryInstallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_commands_v1_ZipLibraryInstallResponse(buffer_arg) {
  return cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The main Arduino Platform service API
var ArduinoCoreServiceService = exports['cc.arduino.cli.commands.v1.ArduinoCoreService'] = {
  // Create a new Arduino Core instance
create: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Create',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.CreateRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.CreateResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_CreateRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_CreateRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_CreateResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_CreateResponse,
  },
  // Initializes an existing Arduino Core instance by loading platforms and
// libraries
init: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Init',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_commands_pb.InitRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.InitResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_InitRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_InitRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_InitResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_InitResponse,
  },
  // Destroy an instance of the Arduino Core Service
destroy: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Destroy',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.DestroyRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.DestroyResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_DestroyRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_DestroyRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_DestroyResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_DestroyResponse,
  },
  // Update package index of the Arduino Core Service
updateIndex: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/UpdateIndex',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_commands_pb.UpdateIndexRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.UpdateIndexResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_UpdateIndexRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_UpdateIndexRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_UpdateIndexResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_UpdateIndexResponse,
  },
  // Update libraries index
updateLibrariesIndex: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/UpdateLibrariesIndex',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.UpdateLibrariesIndexResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_UpdateLibrariesIndexResponse,
  },
  // Get the version of Arduino CLI in use.
version: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Version',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.VersionRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.VersionResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_VersionRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_VersionRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_VersionResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_VersionResponse,
  },
  // Create a new Sketch
newSketch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/NewSketch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.NewSketchRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.NewSketchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_NewSketchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_NewSketchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_NewSketchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_NewSketchResponse,
  },
  // Returns all files composing a Sketch
loadSketch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LoadSketch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.LoadSketchRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.LoadSketchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LoadSketchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LoadSketchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LoadSketchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LoadSketchResponse,
  },
  // Creates a zip file containing all files of specified Sketch
archiveSketch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/ArchiveSketch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.ArchiveSketchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_ArchiveSketchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_ArchiveSketchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_ArchiveSketchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_ArchiveSketchResponse,
  },
  // Sets the sketch default FQBN and Port Address/Protocol in
// the sketch project file (sketch.yaml). These metadata can be retrieved
// using LoadSketch.
setSketchDefaults: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/SetSketchDefaults',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsRequest,
    responseType: cc_arduino_cli_commands_v1_commands_pb.SetSketchDefaultsResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_SetSketchDefaultsRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_SetSketchDefaultsRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_SetSketchDefaultsResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_SetSketchDefaultsResponse,
  },
  // BOARD COMMANDS
// --------------
//
// Requests details about a board
boardDetails: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BoardDetails',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_board_pb.BoardDetailsRequest,
    responseType: cc_arduino_cli_commands_v1_board_pb.BoardDetailsResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BoardDetailsRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardDetailsRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BoardDetailsResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardDetailsResponse,
  },
  // List the boards currently connected to the computer.
boardList: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BoardList',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_board_pb.BoardListRequest,
    responseType: cc_arduino_cli_commands_v1_board_pb.BoardListResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BoardListRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BoardListResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListResponse,
  },
  // List all the boards provided by installed platforms.
boardListAll: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BoardListAll',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_board_pb.BoardListAllRequest,
    responseType: cc_arduino_cli_commands_v1_board_pb.BoardListAllResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BoardListAllRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListAllRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BoardListAllResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListAllResponse,
  },
  // Search boards in installed and not installed Platforms.
boardSearch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BoardSearch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_board_pb.BoardSearchRequest,
    responseType: cc_arduino_cli_commands_v1_board_pb.BoardSearchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BoardSearchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardSearchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BoardSearchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardSearchResponse,
  },
  // List boards connection and disconnected events.
boardListWatch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BoardListWatch',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_board_pb.BoardListWatchRequest,
    responseType: cc_arduino_cli_commands_v1_board_pb.BoardListWatchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BoardListWatchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListWatchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BoardListWatchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BoardListWatchResponse,
  },
  // Compile an Arduino sketch.
compile: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Compile',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_compile_pb.CompileRequest,
    responseType: cc_arduino_cli_commands_v1_compile_pb.CompileResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_CompileRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_CompileRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_CompileResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_CompileResponse,
  },
  // Download and install a platform and its tool dependencies.
platformInstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformInstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformInstallRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformInstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformInstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformInstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformInstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformInstallResponse,
  },
  // Download a platform and its tool dependencies to the `staging/packages`
// subdirectory of the data directory.
platformDownload: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformDownload',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformDownloadRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformDownloadResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformDownloadRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformDownloadRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformDownloadResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformDownloadResponse,
  },
  // Uninstall a platform as well as its tool dependencies that are not used by
// other installed platforms.
platformUninstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformUninstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformUninstallRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformUninstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformUninstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformUninstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformUninstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformUninstallResponse,
  },
  // Upgrade an installed platform to the latest version.
platformUpgrade: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformUpgrade',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformUpgradeResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformUpgradeRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformUpgradeRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformUpgradeResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformUpgradeResponse,
  },
  // Upload a compiled sketch to a board.
upload: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Upload',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_upload_pb.UploadRequest,
    responseType: cc_arduino_cli_commands_v1_upload_pb.UploadResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_UploadRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_UploadRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_UploadResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_UploadResponse,
  },
  // Upload a compiled sketch to a board using a programmer.
uploadUsingProgrammer: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/UploadUsingProgrammer',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerRequest,
    responseType: cc_arduino_cli_commands_v1_upload_pb.UploadUsingProgrammerResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_UploadUsingProgrammerResponse,
  },
  // Returns the list of users fields necessary to upload to that board
// using the specified protocol.
supportedUserFields: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/SupportedUserFields',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsRequest,
    responseType: cc_arduino_cli_commands_v1_upload_pb.SupportedUserFieldsResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_SupportedUserFieldsRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_SupportedUserFieldsRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_SupportedUserFieldsResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_SupportedUserFieldsResponse,
  },
  // List programmers available for a board.
listProgrammersAvailableForUpload: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/ListProgrammersAvailableForUpload',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadRequest,
    responseType: cc_arduino_cli_commands_v1_upload_pb.ListProgrammersAvailableForUploadResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_ListProgrammersAvailableForUploadResponse,
  },
  // Burn bootloader to a board.
burnBootloader: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/BurnBootloader',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderRequest,
    responseType: cc_arduino_cli_commands_v1_upload_pb.BurnBootloaderResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_BurnBootloaderRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_BurnBootloaderRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_BurnBootloaderResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_BurnBootloaderResponse,
  },
  // Search for a platform in the platforms indexes.
platformSearch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformSearch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformSearchRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformSearchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformSearchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformSearchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformSearchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformSearchResponse,
  },
  // List all installed platforms.
platformList: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/PlatformList',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_core_pb.PlatformListRequest,
    responseType: cc_arduino_cli_commands_v1_core_pb.PlatformListResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_PlatformListRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformListRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_PlatformListResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_PlatformListResponse,
  },
  // Download the archive file of an Arduino library in the libraries index to
// the staging directory.
libraryDownload: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryDownload',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryDownloadResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryDownloadRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryDownloadRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryDownloadResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryDownloadResponse,
  },
  // Download and install an Arduino library from the libraries index.
libraryInstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryInstallRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryInstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryInstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryInstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryInstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryInstallResponse,
  },
  // Upgrade a library to the newest version available.
libraryUpgrade: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryUpgrade',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUpgradeRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUpgradeResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeResponse,
  },
  // Install a library from a Zip File
zipLibraryInstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/ZipLibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.ZipLibraryInstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_ZipLibraryInstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_ZipLibraryInstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_ZipLibraryInstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_ZipLibraryInstallResponse,
  },
  // Download and install a library from a git url
gitLibraryInstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/GitLibraryInstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.GitLibraryInstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_GitLibraryInstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_GitLibraryInstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_GitLibraryInstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_GitLibraryInstallResponse,
  },
  // Uninstall an Arduino library.
libraryUninstall: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryUninstall',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryUninstallResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUninstallRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUninstallRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUninstallResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUninstallResponse,
  },
  // Upgrade all installed Arduino libraries to the newest version available.
libraryUpgradeAll: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryUpgradeAll',
    requestStream: false,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryUpgradeAllResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryUpgradeAllResponse,
  },
  // List the recursive dependencies of a library, as defined by the `depends`
// field of the library.properties files.
libraryResolveDependencies: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryResolveDependencies',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryResolveDependenciesResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryResolveDependenciesResponse,
  },
  // Search the Arduino libraries index for libraries.
librarySearch: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibrarySearch',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibrarySearchRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibrarySearchResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibrarySearchRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibrarySearchRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibrarySearchResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibrarySearchResponse,
  },
  // List the installed libraries.
libraryList: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/LibraryList',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_lib_pb.LibraryListRequest,
    responseType: cc_arduino_cli_commands_v1_lib_pb.LibraryListResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_LibraryListRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryListRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_LibraryListResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_LibraryListResponse,
  },
  // Open a monitor connection to a board port
monitor: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Monitor',
    requestStream: true,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_monitor_pb.MonitorRequest,
    responseType: cc_arduino_cli_commands_v1_monitor_pb.MonitorResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_MonitorRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_MonitorRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_MonitorResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_MonitorResponse,
  },
  // Returns the parameters that can be set in the MonitorRequest calls
enumerateMonitorPortSettings: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/EnumerateMonitorPortSettings',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsRequest,
    responseType: cc_arduino_cli_commands_v1_monitor_pb.EnumerateMonitorPortSettingsResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_EnumerateMonitorPortSettingsResponse,
  },
  // Start a debug session and communicate with the debugger tool.
debug: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/Debug',
    requestStream: true,
    responseStream: true,
    requestType: cc_arduino_cli_commands_v1_debug_pb.DebugRequest,
    responseType: cc_arduino_cli_commands_v1_debug_pb.DebugResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_DebugRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_DebugRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_DebugResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_DebugResponse,
  },
  getDebugConfig: {
    path: '/cc.arduino.cli.commands.v1.ArduinoCoreService/GetDebugConfig',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigRequest,
    responseType: cc_arduino_cli_commands_v1_debug_pb.GetDebugConfigResponse,
    requestSerialize: serialize_cc_arduino_cli_commands_v1_GetDebugConfigRequest,
    requestDeserialize: deserialize_cc_arduino_cli_commands_v1_GetDebugConfigRequest,
    responseSerialize: serialize_cc_arduino_cli_commands_v1_GetDebugConfigResponse,
    responseDeserialize: deserialize_cc_arduino_cli_commands_v1_GetDebugConfigResponse,
  },
};

