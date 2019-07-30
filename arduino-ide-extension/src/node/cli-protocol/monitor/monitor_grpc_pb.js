// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// This file is part of arduino-cli.
//
// Copyright 2019 ARDUINO SA (http://www.arduino.cc/)
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
var grpc = require('@grpc/grpc-js');
var monitor_monitor_pb = require('../monitor/monitor_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_cc_arduino_cli_monitor_StreamingOpenReq(arg) {
  if (!(arg instanceof monitor_monitor_pb.StreamingOpenReq)) {
    throw new Error('Expected argument of type cc.arduino.cli.monitor.StreamingOpenReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_monitor_StreamingOpenReq(buffer_arg) {
  return monitor_monitor_pb.StreamingOpenReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_monitor_StreamingOpenResp(arg) {
  if (!(arg instanceof monitor_monitor_pb.StreamingOpenResp)) {
    throw new Error('Expected argument of type cc.arduino.cli.monitor.StreamingOpenResp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_monitor_StreamingOpenResp(buffer_arg) {
  return monitor_monitor_pb.StreamingOpenResp.deserializeBinary(new Uint8Array(buffer_arg));
}


// Service that abstract a Monitor usage
var MonitorService = exports.MonitorService = {
  streamingOpen: {
    path: '/cc.arduino.cli.monitor.Monitor/StreamingOpen',
    requestStream: true,
    responseStream: true,
    requestType: monitor_monitor_pb.StreamingOpenReq,
    responseType: monitor_monitor_pb.StreamingOpenResp,
    requestSerialize: serialize_cc_arduino_cli_monitor_StreamingOpenReq,
    requestDeserialize: deserialize_cc_arduino_cli_monitor_StreamingOpenReq,
    responseSerialize: serialize_cc_arduino_cli_monitor_StreamingOpenResp,
    responseDeserialize: deserialize_cc_arduino_cli_monitor_StreamingOpenResp,
  },
};

exports.MonitorClient = grpc.makeGenericClientConstructor(MonitorService);
