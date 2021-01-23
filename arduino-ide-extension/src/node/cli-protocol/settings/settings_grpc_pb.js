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
var settings_settings_pb = require('../settings/settings_pb.js');

function serialize_cc_arduino_cli_settings_GetAllRequest(arg) {
  if (!(arg instanceof settings_settings_pb.GetAllRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.GetAllRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_GetAllRequest(buffer_arg) {
  return settings_settings_pb.GetAllRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_GetValueRequest(arg) {
  if (!(arg instanceof settings_settings_pb.GetValueRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.GetValueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_GetValueRequest(buffer_arg) {
  return settings_settings_pb.GetValueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_MergeResponse(arg) {
  if (!(arg instanceof settings_settings_pb.MergeResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.MergeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_MergeResponse(buffer_arg) {
  return settings_settings_pb.MergeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_RawData(arg) {
  if (!(arg instanceof settings_settings_pb.RawData)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.RawData');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_RawData(buffer_arg) {
  return settings_settings_pb.RawData.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_SetValueResponse(arg) {
  if (!(arg instanceof settings_settings_pb.SetValueResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.SetValueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_SetValueResponse(buffer_arg) {
  return settings_settings_pb.SetValueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_Value(arg) {
  if (!(arg instanceof settings_settings_pb.Value)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.Value');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_Value(buffer_arg) {
  return settings_settings_pb.Value.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_WriteRequest(arg) {
  if (!(arg instanceof settings_settings_pb.WriteRequest)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.WriteRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_WriteRequest(buffer_arg) {
  return settings_settings_pb.WriteRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_cc_arduino_cli_settings_WriteResponse(arg) {
  if (!(arg instanceof settings_settings_pb.WriteResponse)) {
    throw new Error('Expected argument of type cc.arduino.cli.settings.WriteResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_cc_arduino_cli_settings_WriteResponse(buffer_arg) {
  return settings_settings_pb.WriteResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Settings service provides an interface to Arduino CLI's configuration
// options
var SettingsService = exports['cc.arduino.cli.settings.Settings'] = {
  // List all the settings.
getAll: {
    path: '/cc.arduino.cli.settings.Settings/GetAll',
    requestStream: false,
    responseStream: false,
    requestType: settings_settings_pb.GetAllRequest,
    responseType: settings_settings_pb.RawData,
    requestSerialize: serialize_cc_arduino_cli_settings_GetAllRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_GetAllRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_RawData,
    responseDeserialize: deserialize_cc_arduino_cli_settings_RawData,
  },
  // Set multiple settings values at once.
merge: {
    path: '/cc.arduino.cli.settings.Settings/Merge',
    requestStream: false,
    responseStream: false,
    requestType: settings_settings_pb.RawData,
    responseType: settings_settings_pb.MergeResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_RawData,
    requestDeserialize: deserialize_cc_arduino_cli_settings_RawData,
    responseSerialize: serialize_cc_arduino_cli_settings_MergeResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_MergeResponse,
  },
  // Get the value of a specific setting.
getValue: {
    path: '/cc.arduino.cli.settings.Settings/GetValue',
    requestStream: false,
    responseStream: false,
    requestType: settings_settings_pb.GetValueRequest,
    responseType: settings_settings_pb.Value,
    requestSerialize: serialize_cc_arduino_cli_settings_GetValueRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_GetValueRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_Value,
    responseDeserialize: deserialize_cc_arduino_cli_settings_Value,
  },
  // Set the value of a specific setting.
setValue: {
    path: '/cc.arduino.cli.settings.Settings/SetValue',
    requestStream: false,
    responseStream: false,
    requestType: settings_settings_pb.Value,
    responseType: settings_settings_pb.SetValueResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_Value,
    requestDeserialize: deserialize_cc_arduino_cli_settings_Value,
    responseSerialize: serialize_cc_arduino_cli_settings_SetValueResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_SetValueResponse,
  },
  // Writes to file settings currently stored in memory
write: {
    path: '/cc.arduino.cli.settings.Settings/Write',
    requestStream: false,
    responseStream: false,
    requestType: settings_settings_pb.WriteRequest,
    responseType: settings_settings_pb.WriteResponse,
    requestSerialize: serialize_cc_arduino_cli_settings_WriteRequest,
    requestDeserialize: deserialize_cc_arduino_cli_settings_WriteRequest,
    responseSerialize: serialize_cc_arduino_cli_settings_WriteResponse,
    responseDeserialize: deserialize_cc_arduino_cli_settings_WriteResponse,
  },
};

