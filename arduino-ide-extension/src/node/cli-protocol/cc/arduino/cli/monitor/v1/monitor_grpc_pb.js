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
var cc_arduino_cli_monitor_v1_monitor_pb = require('../../../../../cc/arduino/cli/monitor/v1/monitor_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_cc_arduino_cli_monitor_v1_StreamingOpenRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.monitor.v1.StreamingOpenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_monitor_v1_StreamingOpenRequest(buffer_arg) {
  return cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_monitor_v1_StreamingOpenResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.monitor.v1.StreamingOpenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_monitor_v1_StreamingOpenResponse(buffer_arg) {
  return cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// MonitorService provides services for boards monitor.
// DEPRECATION WARNING: MonitorService is deprecated and will be removed in a
// future release. Use ArduinoCoreService.Monitor and
// ArduinoCoreService.EnumerateMonitorPortSettings instead.
var MonitorServiceService = exports['cc.arduino.cli.monitor.v1.MonitorService'] = {
  // Open a bidirectional monitor stream. This can be used to implement
// something similar to the Arduino IDE's Serial Monitor.
streamingOpen: {
    path: '/cc.arduino.cli.monitor.v1.MonitorService/StreamingOpen',
    requestStream: true,
    responseStream: true,
    requestType: cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenRequest,
    responseType: cc_arduino_cli_monitor_v1_monitor_pb.StreamingOpenResponse,
    requestSerialize: serialize_cc_arduino_cli_monitor_v1_StreamingOpenRequest,
    requestDeserialize: deserialize_cc_arduino_cli_monitor_v1_StreamingOpenRequest,
    responseSerialize: serialize_cc_arduino_cli_monitor_v1_StreamingOpenResponse,
    responseDeserialize: deserialize_cc_arduino_cli_monitor_v1_StreamingOpenResponse,
  },
};

