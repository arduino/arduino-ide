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
var cc_arduino_cli_settings_v1_settings_pb = require('../../../../../cc/arduino/cli/settings/v1/settings_pb.js');

function serialize_cc_arduino_cli_settings_v1_GetAllRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.GetAllRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.GetAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_GetAllRequest(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.GetAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_GetAllResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.GetAllResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.GetAllResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_GetAllResponse(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.GetAllResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_GetValueRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.GetValueRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.GetValueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_GetValueRequest(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.GetValueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_GetValueResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.GetValueResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.GetValueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_GetValueResponse(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.GetValueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_MergeRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.MergeRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.MergeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_MergeRequest(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.MergeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_MergeResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.MergeResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.MergeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_MergeResponse(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.MergeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_SetValueRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.SetValueRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.SetValueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_SetValueRequest(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.SetValueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_SetValueResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.SetValueResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.SetValueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_SetValueResponse(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.SetValueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_WriteRequest(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.WriteRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.WriteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_WriteRequest(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.WriteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_v1_WriteResponse(arg) {
  if (!(arg instanceof cc_arduino_cli_settings_v1_settings_pb.WriteResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.v1.WriteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_v1_WriteResponse(buffer_arg) {
  return cc_arduino_cli_settings_v1_settings_pb.WriteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The SettingsService provides an interface to Arduino CLI configuration
// options
var SettingsServiceService = exports['cc.arduino.cli.settings.v1.SettingsService'] = {
  // List all the settings.
getAll: {
    path: '/cc.arduino.cli.settings.v1.SettingsService/GetAll',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_settings_v1_settings_pb.GetAllRequest,
    responseType: cc_arduino_cli_settings_v1_settings_pb.GetAllResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_v1_GetAllRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_v1_GetAllRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_v1_GetAllResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_v1_GetAllResponse,
  },
  // Set multiple settings values at once.
merge: {
    path: '/cc.arduino.cli.settings.v1.SettingsService/Merge',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_settings_v1_settings_pb.MergeRequest,
    responseType: cc_arduino_cli_settings_v1_settings_pb.MergeResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_v1_MergeRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_v1_MergeRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_v1_MergeResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_v1_MergeResponse,
  },
  // Get the value of a specific setting.
getValue: {
    path: '/cc.arduino.cli.settings.v1.SettingsService/GetValue',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_settings_v1_settings_pb.GetValueRequest,
    responseType: cc_arduino_cli_settings_v1_settings_pb.GetValueResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_v1_GetValueRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_v1_GetValueRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_v1_GetValueResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_v1_GetValueResponse,
  },
  // Set the value of a specific setting.
setValue: {
    path: '/cc.arduino.cli.settings.v1.SettingsService/SetValue',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_settings_v1_settings_pb.SetValueRequest,
    responseType: cc_arduino_cli_settings_v1_settings_pb.SetValueResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_v1_SetValueRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_v1_SetValueRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_v1_SetValueResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_v1_SetValueResponse,
  },
  // Writes to file settings currently stored in memory
write: {
    path: '/cc.arduino.cli.settings.v1.SettingsService/Write',
    requestStream: false,
    responseStream: false,
    requestType: cc_arduino_cli_settings_v1_settings_pb.WriteRequest,
    responseType: cc_arduino_cli_settings_v1_settings_pb.WriteResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_v1_WriteRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_v1_WriteRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_v1_WriteResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_v1_WriteResponse,
  },
};

