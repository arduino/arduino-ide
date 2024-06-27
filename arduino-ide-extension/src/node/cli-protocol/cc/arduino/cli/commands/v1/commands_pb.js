// source: cc/arduino/cli/commands/v1/commands.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

var google_rpc_status_pb = require('../../../../../google/rpc/status_pb.js');
goog.object.extend(proto, google_rpc_status_pb);
var cc_arduino_cli_commands_v1_common_pb = require('../../../../../cc/arduino/cli/commands/v1/common_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_common_pb);
var cc_arduino_cli_commands_v1_board_pb = require('../../../../../cc/arduino/cli/commands/v1/board_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_board_pb);
var cc_arduino_cli_commands_v1_compile_pb = require('../../../../../cc/arduino/cli/commands/v1/compile_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_compile_pb);
var cc_arduino_cli_commands_v1_core_pb = require('../../../../../cc/arduino/cli/commands/v1/core_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_core_pb);
var cc_arduino_cli_commands_v1_debug_pb = require('../../../../../cc/arduino/cli/commands/v1/debug_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_debug_pb);
var cc_arduino_cli_commands_v1_monitor_pb = require('../../../../../cc/arduino/cli/commands/v1/monitor_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_monitor_pb);
var cc_arduino_cli_commands_v1_upload_pb = require('../../../../../cc/arduino/cli/commands/v1/upload_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_upload_pb);
var cc_arduino_cli_commands_v1_lib_pb = require('../../../../../cc/arduino/cli/commands/v1/lib_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_lib_pb);
var cc_arduino_cli_commands_v1_settings_pb = require('../../../../../cc/arduino/cli/commands/v1/settings_pb.js');
goog.object.extend(proto, cc_arduino_cli_commands_v1_settings_pb);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CreateRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.CreateResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.DestroyRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.DestroyResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.FailedInstanceInitError', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.IndexUpdateReport', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.InitRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.InitResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.InitResponse.MessageCase', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.InitResponse.Progress', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.LoadSketchRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.LoadSketchResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.NewSketchRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.NewSketchResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateIndexRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateIndexResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.MessageCase', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.MessageCase', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.VersionRequest', null, global);
goog.exportSymbol('proto.cc.arduino.cli.commands.v1.VersionResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CreateRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CreateRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CreateRequest.displayName = 'proto.cc.arduino.cli.commands.v1.CreateRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CreateResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CreateResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CreateResponse.displayName = 'proto.cc.arduino.cli.commands.v1.CreateResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.InitRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.InitRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.InitRequest.displayName = 'proto.cc.arduino.cli.commands.v1.InitRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.InitResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.InitResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.InitResponse.displayName = 'proto.cc.arduino.cli.commands.v1.InitResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.InitResponse.Progress, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.InitResponse.Progress.displayName = 'proto.cc.arduino.cli.commands.v1.InitResponse.Progress';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.FailedInstanceInitError, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.displayName = 'proto.cc.arduino.cli.commands.v1.FailedInstanceInitError';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.DestroyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.DestroyRequest.displayName = 'proto.cc.arduino.cli.commands.v1.DestroyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.DestroyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.DestroyResponse.displayName = 'proto.cc.arduino.cli.commands.v1.DestroyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateIndexRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateIndexRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.oneofGroups_);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateIndexResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateIndexResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.repeatedFields_, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.oneofGroups_);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.displayName = 'proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.IndexUpdateReport, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.IndexUpdateReport.displayName = 'proto.cc.arduino.cli.commands.v1.IndexUpdateReport';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.VersionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.VersionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.VersionRequest.displayName = 'proto.cc.arduino.cli.commands.v1.VersionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.VersionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.VersionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.VersionResponse.displayName = 'proto.cc.arduino.cli.commands.v1.VersionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.NewSketchRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.NewSketchRequest.displayName = 'proto.cc.arduino.cli.commands.v1.NewSketchRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.NewSketchResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.NewSketchResponse.displayName = 'proto.cc.arduino.cli.commands.v1.NewSketchResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.LoadSketchRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.LoadSketchRequest.displayName = 'proto.cc.arduino.cli.commands.v1.LoadSketchRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.LoadSketchResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.LoadSketchResponse.displayName = 'proto.cc.arduino.cli.commands.v1.LoadSketchResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.displayName = 'proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.displayName = 'proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.displayName = 'proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.displayName = 'proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.displayName = 'proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.displayName = 'proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.displayName = 'proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.displayName = 'proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CreateRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CreateRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CreateRequest}
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CreateRequest;
  return proto.cc.arduino.cli.commands.v1.CreateRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CreateRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CreateRequest}
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CreateRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CreateRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CreateRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CreateResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CreateResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CreateResponse}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CreateResponse;
  return proto.cc.arduino.cli.commands.v1.CreateResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CreateResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CreateResponse}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CreateResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CreateResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.CreateResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.CreateResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.CreateResponse.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.InitRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.InitRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f),
    profile: jspb.Message.getFieldWithDefault(msg, 2, ""),
    sketchPath: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.InitRequest;
  return proto.cc.arduino.cli.commands.v1.InitRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.InitRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setProfile(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchPath(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.InitRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.InitRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
  f = message.getProfile();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSketchPath();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest} returns this
*/
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional string profile = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.getProfile = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.setProfile = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string sketch_path = 3;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.getSketchPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.InitRequest.prototype.setSketchPath = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_ = [[1,2,3]];

/**
 * @enum {number}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.MessageCase = {
  MESSAGE_NOT_SET: 0,
  INIT_PROGRESS: 1,
  ERROR: 2,
  PROFILE: 3
};

/**
 * @return {proto.cc.arduino.cli.commands.v1.InitResponse.MessageCase}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.getMessageCase = function() {
  return /** @type {proto.cc.arduino.cli.commands.v1.InitResponse.MessageCase} */(jspb.Message.computeOneofCase(this, proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.InitResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    initProgress: (f = msg.getInitProgress()) && proto.cc.arduino.cli.commands.v1.InitResponse.Progress.toObject(includeInstance, f),
    error: (f = msg.getError()) && google_rpc_status_pb.Status.toObject(includeInstance, f),
    profile: (f = msg.getProfile()) && cc_arduino_cli_commands_v1_common_pb.SketchProfile.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.InitResponse;
  return proto.cc.arduino.cli.commands.v1.InitResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.cc.arduino.cli.commands.v1.InitResponse.Progress;
      reader.readMessage(value,proto.cc.arduino.cli.commands.v1.InitResponse.Progress.deserializeBinaryFromReader);
      msg.setInitProgress(value);
      break;
    case 2:
      var value = new google_rpc_status_pb.Status;
      reader.readMessage(value,google_rpc_status_pb.Status.deserializeBinaryFromReader);
      msg.setError(value);
      break;
    case 3:
      var value = new cc_arduino_cli_commands_v1_common_pb.SketchProfile;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.SketchProfile.deserializeBinaryFromReader);
      msg.setProfile(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.InitResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInitProgress();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.cc.arduino.cli.commands.v1.InitResponse.Progress.serializeBinaryToWriter
    );
  }
  f = message.getError();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      google_rpc_status_pb.Status.serializeBinaryToWriter
    );
  }
  f = message.getProfile();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      cc_arduino_cli_commands_v1_common_pb.SketchProfile.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.InitResponse.Progress.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.toObject = function(includeInstance, msg) {
  var f, obj = {
    downloadProgress: (f = msg.getDownloadProgress()) && cc_arduino_cli_commands_v1_common_pb.DownloadProgress.toObject(includeInstance, f),
    taskProgress: (f = msg.getTaskProgress()) && cc_arduino_cli_commands_v1_common_pb.TaskProgress.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.InitResponse.Progress;
  return proto.cc.arduino.cli.commands.v1.InitResponse.Progress.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.DownloadProgress;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.DownloadProgress.deserializeBinaryFromReader);
      msg.setDownloadProgress(value);
      break;
    case 2:
      var value = new cc_arduino_cli_commands_v1_common_pb.TaskProgress;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.TaskProgress.deserializeBinaryFromReader);
      msg.setTaskProgress(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.InitResponse.Progress.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDownloadProgress();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.DownloadProgress.serializeBinaryToWriter
    );
  }
  f = message.getTaskProgress();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      cc_arduino_cli_commands_v1_common_pb.TaskProgress.serializeBinaryToWriter
    );
  }
};


/**
 * optional DownloadProgress download_progress = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.DownloadProgress}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.getDownloadProgress = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.DownloadProgress} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.DownloadProgress, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.DownloadProgress|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} returns this
*/
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.setDownloadProgress = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} returns this
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.clearDownloadProgress = function() {
  return this.setDownloadProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.hasDownloadProgress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional TaskProgress task_progress = 2;
 * @return {?proto.cc.arduino.cli.commands.v1.TaskProgress}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.getTaskProgress = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.TaskProgress} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.TaskProgress, 2));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.TaskProgress|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} returns this
*/
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.setTaskProgress = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse.Progress} returns this
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.clearTaskProgress = function() {
  return this.setTaskProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.Progress.prototype.hasTaskProgress = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional Progress init_progress = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.InitResponse.Progress}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.getInitProgress = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.InitResponse.Progress} */ (
    jspb.Message.getWrapperField(this, proto.cc.arduino.cli.commands.v1.InitResponse.Progress, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.InitResponse.Progress|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.setInitProgress = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.clearInitProgress = function() {
  return this.setInitProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.hasInitProgress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional google.rpc.Status error = 2;
 * @return {?proto.google.rpc.Status}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.getError = function() {
  return /** @type{?proto.google.rpc.Status} */ (
    jspb.Message.getWrapperField(this, google_rpc_status_pb.Status, 2));
};


/**
 * @param {?proto.google.rpc.Status|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.setError = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.clearError = function() {
  return this.setError(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.hasError = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional SketchProfile profile = 3;
 * @return {?proto.cc.arduino.cli.commands.v1.SketchProfile}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.getProfile = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.SketchProfile} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.SketchProfile, 3));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.SketchProfile|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.setProfile = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.cc.arduino.cli.commands.v1.InitResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.InitResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.clearProfile = function() {
  return this.setProfile(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.InitResponse.prototype.hasProfile = function() {
  return jspb.Message.getField(this, 3) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.toObject = function(includeInstance, msg) {
  var f, obj = {
    reason: jspb.Message.getFieldWithDefault(msg, 1, 0),
    message: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.FailedInstanceInitError;
  return proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason} */ (reader.readEnum());
      msg.setReason(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessage(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getReason();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getMessage();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional FailedInstanceInitReason reason = 1;
 * @return {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.getReason = function() {
  return /** @type {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason} value
 * @return {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError} returns this
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.setReason = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string message = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.getMessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.FailedInstanceInitError} returns this
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitError.prototype.setMessage = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.DestroyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyRequest}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.DestroyRequest;
  return proto.cc.arduino.cli.commands.v1.DestroyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyRequest}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.DestroyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyRequest} returns this
*/
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.DestroyRequest.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.DestroyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyResponse}
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.DestroyResponse;
  return proto.cc.arduino.cli.commands.v1.DestroyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.DestroyResponse}
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.DestroyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.DestroyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.DestroyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f),
    ignoreCustomPackageIndexes: jspb.Message.getBooleanFieldWithDefault(msg, 2, false),
    updateIfOlderThanSecs: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateIndexRequest;
  return proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    case 2:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIgnoreCustomPackageIndexes(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUpdateIfOlderThanSecs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
  f = message.getIgnoreCustomPackageIndexes();
  if (f) {
    writer.writeBool(
      2,
      f
    );
  }
  f = message.getUpdateIfOlderThanSecs();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional bool ignore_custom_package_indexes = 2;
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.getIgnoreCustomPackageIndexes = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 2, false));
};


/**
 * @param {boolean} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.setIgnoreCustomPackageIndexes = function(value) {
  return jspb.Message.setProto3BooleanField(this, 2, value);
};


/**
 * optional int64 update_if_older_than_secs = 3;
 * @return {number}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.getUpdateIfOlderThanSecs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexRequest.prototype.setUpdateIfOlderThanSecs = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.MessageCase = {
  MESSAGE_NOT_SET: 0,
  DOWNLOAD_PROGRESS: 1,
  RESULT: 2
};

/**
 * @return {proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.MessageCase}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.getMessageCase = function() {
  return /** @type {proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.MessageCase} */(jspb.Message.computeOneofCase(this, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    downloadProgress: (f = msg.getDownloadProgress()) && cc_arduino_cli_commands_v1_common_pb.DownloadProgress.toObject(includeInstance, f),
    result: (f = msg.getResult()) && proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateIndexResponse;
  return proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.DownloadProgress;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.DownloadProgress.deserializeBinaryFromReader);
      msg.setDownloadProgress(value);
      break;
    case 2:
      var value = new proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result;
      reader.readMessage(value,proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.deserializeBinaryFromReader);
      msg.setResult(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDownloadProgress();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.DownloadProgress.serializeBinaryToWriter
    );
  }
  f = message.getResult();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.toObject = function(includeInstance, msg) {
  var f, obj = {
    updatedIndexesList: jspb.Message.toObjectList(msg.getUpdatedIndexesList(),
    proto.cc.arduino.cli.commands.v1.IndexUpdateReport.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result;
  return proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.cc.arduino.cli.commands.v1.IndexUpdateReport;
      reader.readMessage(value,proto.cc.arduino.cli.commands.v1.IndexUpdateReport.deserializeBinaryFromReader);
      msg.addUpdatedIndexes(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUpdatedIndexesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.cc.arduino.cli.commands.v1.IndexUpdateReport.serializeBinaryToWriter
    );
  }
};


/**
 * repeated IndexUpdateReport updated_indexes = 1;
 * @return {!Array<!proto.cc.arduino.cli.commands.v1.IndexUpdateReport>}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.getUpdatedIndexesList = function() {
  return /** @type{!Array<!proto.cc.arduino.cli.commands.v1.IndexUpdateReport>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.cc.arduino.cli.commands.v1.IndexUpdateReport, 1));
};


/**
 * @param {!Array<!proto.cc.arduino.cli.commands.v1.IndexUpdateReport>} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.setUpdatedIndexesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport=} opt_value
 * @param {number=} opt_index
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.addUpdatedIndexes = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.cc.arduino.cli.commands.v1.IndexUpdateReport, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result.prototype.clearUpdatedIndexesList = function() {
  return this.setUpdatedIndexesList([]);
};


/**
 * optional DownloadProgress download_progress = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.DownloadProgress}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.getDownloadProgress = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.DownloadProgress} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.DownloadProgress, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.DownloadProgress|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.setDownloadProgress = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.clearDownloadProgress = function() {
  return this.setDownloadProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.hasDownloadProgress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Result result = 2;
 * @return {?proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.getResult = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result} */ (
    jspb.Message.getWrapperField(this, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result, 2));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.Result|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.setResult = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateIndexResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.clearResult = function() {
  return this.setResult(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateIndexResponse.prototype.hasResult = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f),
    updateIfOlderThanSecs: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest;
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setUpdateIfOlderThanSecs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
  f = message.getUpdateIfOlderThanSecs();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional int64 update_if_older_than_secs = 2;
 * @return {number}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.getUpdateIfOlderThanSecs = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexRequest.prototype.setUpdateIfOlderThanSecs = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.oneofGroups_ = [[1,2]];

/**
 * @enum {number}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.MessageCase = {
  MESSAGE_NOT_SET: 0,
  DOWNLOAD_PROGRESS: 1,
  RESULT: 2
};

/**
 * @return {proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.MessageCase}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.getMessageCase = function() {
  return /** @type {proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.MessageCase} */(jspb.Message.computeOneofCase(this, proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    downloadProgress: (f = msg.getDownloadProgress()) && cc_arduino_cli_commands_v1_common_pb.DownloadProgress.toObject(includeInstance, f),
    result: (f = msg.getResult()) && proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse;
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.DownloadProgress;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.DownloadProgress.deserializeBinaryFromReader);
      msg.setDownloadProgress(value);
      break;
    case 2:
      var value = new proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result;
      reader.readMessage(value,proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.deserializeBinaryFromReader);
      msg.setResult(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDownloadProgress();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.DownloadProgress.serializeBinaryToWriter
    );
  }
  f = message.getResult();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.serializeBinaryToWriter
    );
  }
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.toObject = function(includeInstance, msg) {
  var f, obj = {
    librariesIndex: (f = msg.getLibrariesIndex()) && proto.cc.arduino.cli.commands.v1.IndexUpdateReport.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result;
  return proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.cc.arduino.cli.commands.v1.IndexUpdateReport;
      reader.readMessage(value,proto.cc.arduino.cli.commands.v1.IndexUpdateReport.deserializeBinaryFromReader);
      msg.setLibrariesIndex(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getLibrariesIndex();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.cc.arduino.cli.commands.v1.IndexUpdateReport.serializeBinaryToWriter
    );
  }
};


/**
 * optional IndexUpdateReport libraries_index = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.IndexUpdateReport}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.getLibrariesIndex = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.IndexUpdateReport} */ (
    jspb.Message.getWrapperField(this, proto.cc.arduino.cli.commands.v1.IndexUpdateReport, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.IndexUpdateReport|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.setLibrariesIndex = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.clearLibrariesIndex = function() {
  return this.setLibrariesIndex(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result.prototype.hasLibrariesIndex = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional DownloadProgress download_progress = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.DownloadProgress}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.getDownloadProgress = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.DownloadProgress} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.DownloadProgress, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.DownloadProgress|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.setDownloadProgress = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.clearDownloadProgress = function() {
  return this.setDownloadProgress(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.hasDownloadProgress = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional Result result = 2;
 * @return {?proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.getResult = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result} */ (
    jspb.Message.getWrapperField(this, proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result, 2));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.Result|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.setResult = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.clearResult = function() {
  return this.setResult(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.UpdateLibrariesIndexResponse.prototype.hasResult = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.IndexUpdateReport.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.toObject = function(includeInstance, msg) {
  var f, obj = {
    indexUrl: jspb.Message.getFieldWithDefault(msg, 1, ""),
    status: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.IndexUpdateReport;
  return proto.cc.arduino.cli.commands.v1.IndexUpdateReport.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIndexUrl(value);
      break;
    case 2:
      var value = /** @type {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status} */ (reader.readEnum());
      msg.setStatus(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.IndexUpdateReport.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIndexUrl();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getStatus();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status = {
  STATUS_UNSPECIFIED: 0,
  STATUS_UPDATED: 1,
  STATUS_ALREADY_UP_TO_DATE: 2,
  STATUS_FAILED: 3,
  STATUS_SKIPPED: 4
};

/**
 * optional string index_url = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.getIndexUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport} returns this
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.setIndexUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional Status status = 2;
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status}
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.getStatus = function() {
  return /** @type {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport.Status} value
 * @return {!proto.cc.arduino.cli.commands.v1.IndexUpdateReport} returns this
 */
proto.cc.arduino.cli.commands.v1.IndexUpdateReport.prototype.setStatus = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.VersionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.VersionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.VersionRequest}
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.VersionRequest;
  return proto.cc.arduino.cli.commands.v1.VersionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.VersionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.VersionRequest}
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.VersionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.VersionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.VersionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.VersionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.VersionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    version: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.VersionResponse}
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.VersionResponse;
  return proto.cc.arduino.cli.commands.v1.VersionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.VersionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.VersionResponse}
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.VersionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.VersionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string version = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.VersionResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.VersionResponse.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.NewSketchRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    sketchName: jspb.Message.getFieldWithDefault(msg, 2, ""),
    sketchDir: jspb.Message.getFieldWithDefault(msg, 3, ""),
    overwrite: jspb.Message.getBooleanFieldWithDefault(msg, 4, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.NewSketchRequest;
  return proto.cc.arduino.cli.commands.v1.NewSketchRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchDir(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOverwrite(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.NewSketchRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSketchName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getSketchDir();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getOverwrite();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
};


/**
 * optional string sketch_name = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.getSketchName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.setSketchName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string sketch_dir = 3;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.getSketchDir = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.setSketchDir = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional bool overwrite = 4;
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.getOverwrite = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.NewSketchRequest.prototype.setOverwrite = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.NewSketchResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    mainFile: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.NewSketchResponse;
  return proto.cc.arduino.cli.commands.v1.NewSketchResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setMainFile(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.NewSketchResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.NewSketchResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getMainFile();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string main_file = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.prototype.getMainFile = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.NewSketchResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.NewSketchResponse.prototype.setMainFile = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.LoadSketchRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    sketchPath: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.LoadSketchRequest;
  return proto.cc.arduino.cli.commands.v1.LoadSketchRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchPath(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.LoadSketchRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSketchPath();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string sketch_path = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.prototype.getSketchPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.LoadSketchRequest.prototype.setSketchPath = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.LoadSketchResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    sketch: (f = msg.getSketch()) && cc_arduino_cli_commands_v1_common_pb.Sketch.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.LoadSketchResponse;
  return proto.cc.arduino.cli.commands.v1.LoadSketchResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Sketch;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Sketch.deserializeBinaryFromReader);
      msg.setSketch(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.LoadSketchResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSketch();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Sketch.serializeBinaryToWriter
    );
  }
};


/**
 * optional Sketch sketch = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Sketch}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.getSketch = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Sketch} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Sketch, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Sketch|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse} returns this
*/
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.setSketch = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.LoadSketchResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.clearSketch = function() {
  return this.setSketch(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.LoadSketchResponse.prototype.hasSketch = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    sketchPath: jspb.Message.getFieldWithDefault(msg, 1, ""),
    archivePath: jspb.Message.getFieldWithDefault(msg, 2, ""),
    includeBuildDir: jspb.Message.getBooleanFieldWithDefault(msg, 3, false),
    overwrite: jspb.Message.getBooleanFieldWithDefault(msg, 4, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest;
  return proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchPath(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setArchivePath(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setIncludeBuildDir(value);
      break;
    case 4:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setOverwrite(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSketchPath();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getArchivePath();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getIncludeBuildDir();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
  f = message.getOverwrite();
  if (f) {
    writer.writeBool(
      4,
      f
    );
  }
};


/**
 * optional string sketch_path = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.getSketchPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.setSketchPath = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string archive_path = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.getArchivePath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.setArchivePath = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bool include_build_dir = 3;
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.getIncludeBuildDir = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.setIncludeBuildDir = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};


/**
 * optional bool overwrite = 4;
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.getOverwrite = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 4, false));
};


/**
 * @param {boolean} value
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchRequest.prototype.setOverwrite = function(value) {
  return jspb.Message.setProto3BooleanField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse;
  return proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.ArchiveSketchResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    sketchPath: jspb.Message.getFieldWithDefault(msg, 1, ""),
    defaultFqbn: jspb.Message.getFieldWithDefault(msg, 2, ""),
    defaultPortAddress: jspb.Message.getFieldWithDefault(msg, 3, ""),
    defaultPortProtocol: jspb.Message.getFieldWithDefault(msg, 4, ""),
    defaultProgrammer: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest;
  return proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSketchPath(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultFqbn(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultPortAddress(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultPortProtocol(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultProgrammer(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSketchPath();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDefaultFqbn();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getDefaultPortAddress();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDefaultPortProtocol();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getDefaultProgrammer();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string sketch_path = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.getSketchPath = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.setSketchPath = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string default_fqbn = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.getDefaultFqbn = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.setDefaultFqbn = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string default_port_address = 3;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.getDefaultPortAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.setDefaultPortAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string default_port_protocol = 4;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.getDefaultPortProtocol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.setDefaultPortProtocol = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string default_programmer = 5;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.getDefaultProgrammer = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsRequest.prototype.setDefaultProgrammer = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    defaultFqbn: jspb.Message.getFieldWithDefault(msg, 1, ""),
    defaultPortAddress: jspb.Message.getFieldWithDefault(msg, 2, ""),
    defaultPortProtocol: jspb.Message.getFieldWithDefault(msg, 3, ""),
    defaultProgrammer: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse;
  return proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultFqbn(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultPortAddress(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultPortProtocol(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setDefaultProgrammer(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDefaultFqbn();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDefaultPortAddress();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getDefaultPortProtocol();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDefaultProgrammer();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string default_fqbn = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.getDefaultFqbn = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.setDefaultFqbn = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string default_port_address = 2;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.getDefaultPortAddress = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.setDefaultPortAddress = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string default_port_protocol = 3;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.getDefaultPortProtocol = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.setDefaultPortProtocol = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string default_programmer = 4;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.getDefaultProgrammer = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.SetSketchDefaultsResponse.prototype.setDefaultProgrammer = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    forceCheck: jspb.Message.getBooleanFieldWithDefault(msg, 1, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest;
  return proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setForceCheck(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getForceCheck();
  if (f) {
    writer.writeBool(
      1,
      f
    );
  }
};


/**
 * optional bool force_check = 1;
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.prototype.getForceCheck = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 1, false));
};


/**
 * @param {boolean} value
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesRequest.prototype.setForceCheck = function(value) {
  return jspb.Message.setProto3BooleanField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    newestVersion: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse;
  return proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setNewestVersion(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNewestVersion();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string newest_version = 1;
 * @return {string}
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.prototype.getNewestVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse} returns this
 */
proto.cc.arduino.cli.commands.v1.CheckForArduinoCLIUpdatesResponse.prototype.setNewestVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    instance: (f = msg.getInstance()) && cc_arduino_cli_commands_v1_common_pb.Instance.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest;
  return proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new cc_arduino_cli_commands_v1_common_pb.Instance;
      reader.readMessage(value,cc_arduino_cli_commands_v1_common_pb.Instance.deserializeBinaryFromReader);
      msg.setInstance(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInstance();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      cc_arduino_cli_commands_v1_common_pb.Instance.serializeBinaryToWriter
    );
  }
};


/**
 * optional Instance instance = 1;
 * @return {?proto.cc.arduino.cli.commands.v1.Instance}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.getInstance = function() {
  return /** @type{?proto.cc.arduino.cli.commands.v1.Instance} */ (
    jspb.Message.getWrapperField(this, cc_arduino_cli_commands_v1_common_pb.Instance, 1));
};


/**
 * @param {?proto.cc.arduino.cli.commands.v1.Instance|undefined} value
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest} returns this
*/
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.setInstance = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest} returns this
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.clearInstance = function() {
  return this.setInstance(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryRequest.prototype.hasInstance = function() {
  return jspb.Message.getField(this, 1) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse;
  return proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.cc.arduino.cli.commands.v1.CleanDownloadCacheDirectoryResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};


/**
 * @enum {number}
 */
proto.cc.arduino.cli.commands.v1.FailedInstanceInitReason = {
  FAILED_INSTANCE_INIT_REASON_UNSPECIFIED: 0,
  FAILED_INSTANCE_INIT_REASON_INVALID_INDEX_URL: 1,
  FAILED_INSTANCE_INIT_REASON_INDEX_LOAD_ERROR: 2,
  FAILED_INSTANCE_INIT_REASON_TOOL_LOAD_ERROR: 3,
  FAILED_INSTANCE_INIT_REASON_INDEX_DOWNLOAD_ERROR: 4
};

goog.object.extend(exports, proto.cc.arduino.cli.commands.v1);
