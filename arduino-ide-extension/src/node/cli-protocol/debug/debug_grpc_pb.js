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
var debug_debug_pb = require('../debug/debug_pb.js');
var commands_common_pb = require('../commands/common_pb.js');

function serialize_cc_arduino_cli_debug_DebugReq(arg) {
  if (!(arg instanceof debug_debug_pb.DebugReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.DebugReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_DebugReq(buffer_arg) {
  return debug_debug_pb.DebugReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_debug_DebugResp(arg) {
  if (!(arg instanceof debug_debug_pb.DebugResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.debug.DebugResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_debug_DebugResp(buffer_arg) {
  return debug_debug_pb.DebugResp.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service that abstract a debug Session usage
var DebugService = exports['cc.arduino.cli.debug.Debug'] = {
  // Start a debug session and communicate with the debugger tool.
debug: {
    path: '/cc.arduino.cli.debug.Debug/Debug',
    requestStream: true,
    responseStream: true,
    requestType: debug_debug_pb.DebugReq,
    responseType: debug_debug_pb.DebugResp,
    requestSerialize: serialize_cc_arduino_cli_debug_DebugReq,
    requestDeserialize: deserialize_cc_arduino_cli_debug_DebugReq,
    responseSerialize: serialize_cc_arduino_cli_debug_DebugResp,
    responseDeserialize: deserialize_cc_arduino_cli_debug_DebugResp,
  },
};

