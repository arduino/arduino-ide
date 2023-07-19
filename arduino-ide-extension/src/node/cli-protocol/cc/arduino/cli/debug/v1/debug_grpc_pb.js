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
var cc_arduino_cli_debug_v1_debug_pb = require('../../../../../cc/arduino/cli/debug/v1/debug_pb.js');
var cc_arduino_cli_commands_v1_common_pb = require('../../../../../cc/arduino/cli/commands/v1/common_pb.js');
var cc_arduino_cli_commands_v1_port_pb = require('../../../../../cc/arduino/cli/commands/v1/port_pb.js');

function serialize_cc_arduino_cli_debug_v1_DebugConfigRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.v1.DebugConfigRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_v1_DebugConfigRequest(buffer_arg) {
  return cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_debug_v1_DebugRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_debug_v1_debug_pb.DebugRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.v1.DebugRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_v1_DebugRequest(buffer_arg) {
  return cc_arduino_cli_debug_v1_debug_pb.DebugRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_debug_v1_DebugResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_debug_v1_debug_pb.DebugResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.v1.DebugResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_v1_DebugResponse(buffer_arg) {
  return cc_arduino_cli_debug_v1_debug_pb.DebugResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_debug_v1_GetDebugConfigResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.v1.GetDebugConfigResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_v1_GetDebugConfigResponse(buffer_arg) {
  return cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// DebugService abstracts a debug Session usage
var DebugServiceService = exports['cc.arduino.cli.debug.v1.DebugService'] = {
  // Start a debug session and communicate with the debugger tool.
debug: {
    path: '/cc.arduino.cli.debug.v1.DebugService/Debug',
    requestStream: true,
    responseStream: true,
    requestType: cc_arduino_cli_debug_v1_debug_pb.DebugRequest,
    responseType: cc_arduino_cli_debug_v1_debug_pb.DebugResponse,
    requestSerialize: serialize_cc_arduino_cli_debug_v1_DebugRequest,
    requestDeserialize: deserialize_cc_arduino_cli_debug_v1_DebugRequest,
    responseSerialize: serialize_cc_arduino_cli_debug_v1_DebugResponse,
    responseDeserialize: deserialize_cc_arduino_cli_debug_v1_DebugResponse,
  },
  getDebugConfig: {
    path: '/cc.arduino.cli.debug.v1.DebugService/GetDebugConfig',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_debug_v1_debug_pb.DebugConfigRequest,
    responseType: cc_arduino_cli_debug_v1_debug_pb.GetDebugConfigResponse,
    requestSerialize: serialize_cc_arduino_cli_debug_v1_DebugConfigRequest,
    requestDeserialize: deserialize_cc_arduino_cli_debug_v1_DebugConfigRequest,
    responseSerialize: serialize_cc_arduino_cli_debug_v1_GetDebugConfigResponse,
    responseDeserialize: deserialize_cc_arduino_cli_debug_v1_GetDebugConfigResponse,
  },
};

