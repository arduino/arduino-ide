// package: arduino
// file: commands.proto

/* tslint:disable */

import * as grpc from "grpc";
import * as commands_pb from "./commands_pb";
import * as common_pb from "./common_pb";
import * as board_pb from "./board_pb";
import * as compile_pb from "./compile_pb";
import * as core_pb from "./core_pb";
import * as upload_pb from "./upload_pb";
import * as lib_pb from "./lib_pb";

interface IArduinoCoreService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    init: IArduinoCoreService_IInit;
    destroy: IArduinoCoreService_IDestroy;
    rescan: IArduinoCoreService_IRescan;
    updateIndex: IArduinoCoreService_IUpdateIndex;
    boardList: IArduinoCoreService_IBoardList;
    boardDetails: IArduinoCoreService_IBoardDetails;
    compile: IArduinoCoreService_ICompile;
    platformInstall: IArduinoCoreService_IPlatformInstall;
    platformDownload: IArduinoCoreService_IPlatformDownload;
    platformUninstall: IArduinoCoreService_IPlatformUninstall;
    platformUpgrade: IArduinoCoreService_IPlatformUpgrade;
    upload: IArduinoCoreService_IUpload;
    platformSearch: IArduinoCoreService_IPlatformSearch;
    platformList: IArduinoCoreService_IPlatformList;
    libraryDownload: IArduinoCoreService_ILibraryDownload;
    libraryInstall: IArduinoCoreService_ILibraryInstall;
    libraryUninstall: IArduinoCoreService_ILibraryUninstall;
    libraryUpgradeAll: IArduinoCoreService_ILibraryUpgradeAll;
    librarySearch: IArduinoCoreService_ILibrarySearch;
    libraryList: IArduinoCoreService_ILibraryList;
}

interface IArduinoCoreService_IInit extends grpc.MethodDefinition<commands_pb.InitReq, commands_pb.InitResp> {
    path: string; // "/arduino.ArduinoCore/Init"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<commands_pb.InitReq>;
    requestDeserialize: grpc.deserialize<commands_pb.InitReq>;
    responseSerialize: grpc.serialize<commands_pb.InitResp>;
    responseDeserialize: grpc.deserialize<commands_pb.InitResp>;
}
interface IArduinoCoreService_IDestroy extends grpc.MethodDefinition<commands_pb.DestroyReq, commands_pb.DestroyResp> {
    path: string; // "/arduino.ArduinoCore/Destroy"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<commands_pb.DestroyReq>;
    requestDeserialize: grpc.deserialize<commands_pb.DestroyReq>;
    responseSerialize: grpc.serialize<commands_pb.DestroyResp>;
    responseDeserialize: grpc.deserialize<commands_pb.DestroyResp>;
}
interface IArduinoCoreService_IRescan extends grpc.MethodDefinition<commands_pb.RescanReq, commands_pb.RescanResp> {
    path: string; // "/arduino.ArduinoCore/Rescan"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<commands_pb.RescanReq>;
    requestDeserialize: grpc.deserialize<commands_pb.RescanReq>;
    responseSerialize: grpc.serialize<commands_pb.RescanResp>;
    responseDeserialize: grpc.deserialize<commands_pb.RescanResp>;
}
interface IArduinoCoreService_IUpdateIndex extends grpc.MethodDefinition<commands_pb.UpdateIndexReq, commands_pb.UpdateIndexResp> {
    path: string; // "/arduino.ArduinoCore/UpdateIndex"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<commands_pb.UpdateIndexReq>;
    requestDeserialize: grpc.deserialize<commands_pb.UpdateIndexReq>;
    responseSerialize: grpc.serialize<commands_pb.UpdateIndexResp>;
    responseDeserialize: grpc.deserialize<commands_pb.UpdateIndexResp>;
}
interface IArduinoCoreService_IBoardList extends grpc.MethodDefinition<board_pb.BoardListReq, board_pb.BoardListResp> {
    path: string; // "/arduino.ArduinoCore/BoardList"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<board_pb.BoardListReq>;
    requestDeserialize: grpc.deserialize<board_pb.BoardListReq>;
    responseSerialize: grpc.serialize<board_pb.BoardListResp>;
    responseDeserialize: grpc.deserialize<board_pb.BoardListResp>;
}
interface IArduinoCoreService_IBoardDetails extends grpc.MethodDefinition<board_pb.BoardDetailsReq, board_pb.BoardDetailsResp> {
    path: string; // "/arduino.ArduinoCore/BoardDetails"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<board_pb.BoardDetailsReq>;
    requestDeserialize: grpc.deserialize<board_pb.BoardDetailsReq>;
    responseSerialize: grpc.serialize<board_pb.BoardDetailsResp>;
    responseDeserialize: grpc.deserialize<board_pb.BoardDetailsResp>;
}
interface IArduinoCoreService_ICompile extends grpc.MethodDefinition<compile_pb.CompileReq, compile_pb.CompileResp> {
    path: string; // "/arduino.ArduinoCore/Compile"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<compile_pb.CompileReq>;
    requestDeserialize: grpc.deserialize<compile_pb.CompileReq>;
    responseSerialize: grpc.serialize<compile_pb.CompileResp>;
    responseDeserialize: grpc.deserialize<compile_pb.CompileResp>;
}
interface IArduinoCoreService_IPlatformInstall extends grpc.MethodDefinition<core_pb.PlatformInstallReq, core_pb.PlatformInstallResp> {
    path: string; // "/arduino.ArduinoCore/PlatformInstall"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<core_pb.PlatformInstallReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformInstallReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformInstallResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformInstallResp>;
}
interface IArduinoCoreService_IPlatformDownload extends grpc.MethodDefinition<core_pb.PlatformDownloadReq, core_pb.PlatformDownloadResp> {
    path: string; // "/arduino.ArduinoCore/PlatformDownload"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<core_pb.PlatformDownloadReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformDownloadReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformDownloadResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformDownloadResp>;
}
interface IArduinoCoreService_IPlatformUninstall extends grpc.MethodDefinition<core_pb.PlatformUninstallReq, core_pb.PlatformUninstallResp> {
    path: string; // "/arduino.ArduinoCore/PlatformUninstall"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<core_pb.PlatformUninstallReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformUninstallReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformUninstallResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformUninstallResp>;
}
interface IArduinoCoreService_IPlatformUpgrade extends grpc.MethodDefinition<core_pb.PlatformUpgradeReq, core_pb.PlatformUpgradeResp> {
    path: string; // "/arduino.ArduinoCore/PlatformUpgrade"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<core_pb.PlatformUpgradeReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformUpgradeReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformUpgradeResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformUpgradeResp>;
}
interface IArduinoCoreService_IUpload extends grpc.MethodDefinition<upload_pb.UploadReq, upload_pb.UploadResp> {
    path: string; // "/arduino.ArduinoCore/Upload"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<upload_pb.UploadReq>;
    requestDeserialize: grpc.deserialize<upload_pb.UploadReq>;
    responseSerialize: grpc.serialize<upload_pb.UploadResp>;
    responseDeserialize: grpc.deserialize<upload_pb.UploadResp>;
}
interface IArduinoCoreService_IPlatformSearch extends grpc.MethodDefinition<core_pb.PlatformSearchReq, core_pb.PlatformSearchResp> {
    path: string; // "/arduino.ArduinoCore/PlatformSearch"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<core_pb.PlatformSearchReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformSearchReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformSearchResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformSearchResp>;
}
interface IArduinoCoreService_IPlatformList extends grpc.MethodDefinition<core_pb.PlatformListReq, core_pb.PlatformListResp> {
    path: string; // "/arduino.ArduinoCore/PlatformList"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<core_pb.PlatformListReq>;
    requestDeserialize: grpc.deserialize<core_pb.PlatformListReq>;
    responseSerialize: grpc.serialize<core_pb.PlatformListResp>;
    responseDeserialize: grpc.deserialize<core_pb.PlatformListResp>;
}
interface IArduinoCoreService_ILibraryDownload extends grpc.MethodDefinition<lib_pb.LibraryDownloadReq, lib_pb.LibraryDownloadResp> {
    path: string; // "/arduino.ArduinoCore/LibraryDownload"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lib_pb.LibraryDownloadReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibraryDownloadReq>;
    responseSerialize: grpc.serialize<lib_pb.LibraryDownloadResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibraryDownloadResp>;
}
interface IArduinoCoreService_ILibraryInstall extends grpc.MethodDefinition<lib_pb.LibraryInstallReq, lib_pb.LibraryInstallResp> {
    path: string; // "/arduino.ArduinoCore/LibraryInstall"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lib_pb.LibraryInstallReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibraryInstallReq>;
    responseSerialize: grpc.serialize<lib_pb.LibraryInstallResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibraryInstallResp>;
}
interface IArduinoCoreService_ILibraryUninstall extends grpc.MethodDefinition<lib_pb.LibraryUninstallReq, lib_pb.LibraryUninstallResp> {
    path: string; // "/arduino.ArduinoCore/LibraryUninstall"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lib_pb.LibraryUninstallReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibraryUninstallReq>;
    responseSerialize: grpc.serialize<lib_pb.LibraryUninstallResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibraryUninstallResp>;
}
interface IArduinoCoreService_ILibraryUpgradeAll extends grpc.MethodDefinition<lib_pb.LibraryUpgradeAllReq, lib_pb.LibraryUpgradeAllResp> {
    path: string; // "/arduino.ArduinoCore/LibraryUpgradeAll"
    requestStream: boolean; // false
    responseStream: boolean; // true
    requestSerialize: grpc.serialize<lib_pb.LibraryUpgradeAllReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibraryUpgradeAllReq>;
    responseSerialize: grpc.serialize<lib_pb.LibraryUpgradeAllResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibraryUpgradeAllResp>;
}
interface IArduinoCoreService_ILibrarySearch extends grpc.MethodDefinition<lib_pb.LibrarySearchReq, lib_pb.LibrarySearchResp> {
    path: string; // "/arduino.ArduinoCore/LibrarySearch"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lib_pb.LibrarySearchReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibrarySearchReq>;
    responseSerialize: grpc.serialize<lib_pb.LibrarySearchResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibrarySearchResp>;
}
interface IArduinoCoreService_ILibraryList extends grpc.MethodDefinition<lib_pb.LibraryListReq, lib_pb.LibraryListResp> {
    path: string; // "/arduino.ArduinoCore/LibraryList"
    requestStream: boolean; // false
    responseStream: boolean; // false
    requestSerialize: grpc.serialize<lib_pb.LibraryListReq>;
    requestDeserialize: grpc.deserialize<lib_pb.LibraryListReq>;
    responseSerialize: grpc.serialize<lib_pb.LibraryListResp>;
    responseDeserialize: grpc.deserialize<lib_pb.LibraryListResp>;
}

export const ArduinoCoreService: IArduinoCoreService;

export interface IArduinoCoreServer {
    init: grpc.handleUnaryCall<commands_pb.InitReq, commands_pb.InitResp>;
    destroy: grpc.handleUnaryCall<commands_pb.DestroyReq, commands_pb.DestroyResp>;
    rescan: grpc.handleUnaryCall<commands_pb.RescanReq, commands_pb.RescanResp>;
    updateIndex: grpc.handleServerStreamingCall<commands_pb.UpdateIndexReq, commands_pb.UpdateIndexResp>;
    boardList: grpc.handleUnaryCall<board_pb.BoardListReq, board_pb.BoardListResp>;
    boardDetails: grpc.handleUnaryCall<board_pb.BoardDetailsReq, board_pb.BoardDetailsResp>;
    compile: grpc.handleServerStreamingCall<compile_pb.CompileReq, compile_pb.CompileResp>;
    platformInstall: grpc.handleServerStreamingCall<core_pb.PlatformInstallReq, core_pb.PlatformInstallResp>;
    platformDownload: grpc.handleServerStreamingCall<core_pb.PlatformDownloadReq, core_pb.PlatformDownloadResp>;
    platformUninstall: grpc.handleServerStreamingCall<core_pb.PlatformUninstallReq, core_pb.PlatformUninstallResp>;
    platformUpgrade: grpc.handleServerStreamingCall<core_pb.PlatformUpgradeReq, core_pb.PlatformUpgradeResp>;
    upload: grpc.handleServerStreamingCall<upload_pb.UploadReq, upload_pb.UploadResp>;
    platformSearch: grpc.handleUnaryCall<core_pb.PlatformSearchReq, core_pb.PlatformSearchResp>;
    platformList: grpc.handleUnaryCall<core_pb.PlatformListReq, core_pb.PlatformListResp>;
    libraryDownload: grpc.handleServerStreamingCall<lib_pb.LibraryDownloadReq, lib_pb.LibraryDownloadResp>;
    libraryInstall: grpc.handleServerStreamingCall<lib_pb.LibraryInstallReq, lib_pb.LibraryInstallResp>;
    libraryUninstall: grpc.handleServerStreamingCall<lib_pb.LibraryUninstallReq, lib_pb.LibraryUninstallResp>;
    libraryUpgradeAll: grpc.handleServerStreamingCall<lib_pb.LibraryUpgradeAllReq, lib_pb.LibraryUpgradeAllResp>;
    librarySearch: grpc.handleUnaryCall<lib_pb.LibrarySearchReq, lib_pb.LibrarySearchResp>;
    libraryList: grpc.handleUnaryCall<lib_pb.LibraryListReq, lib_pb.LibraryListResp>;
}

export interface IArduinoCoreClient {
    init(request: commands_pb.InitReq, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    init(request: commands_pb.InitReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    init(request: commands_pb.InitReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    destroy(request: commands_pb.DestroyReq, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    destroy(request: commands_pb.DestroyReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    destroy(request: commands_pb.DestroyReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_pb.RescanReq, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_pb.RescanReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_pb.RescanReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    updateIndex(request: commands_pb.UpdateIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_pb.UpdateIndexResp>;
    updateIndex(request: commands_pb.UpdateIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_pb.UpdateIndexResp>;
    boardList(request: board_pb.BoardListReq, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardList(request: board_pb.BoardListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardList(request: board_pb.BoardListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: board_pb.BoardDetailsReq, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: board_pb.BoardDetailsReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: board_pb.BoardDetailsReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    compile(request: compile_pb.CompileReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<compile_pb.CompileResp>;
    compile(request: compile_pb.CompileReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<compile_pb.CompileResp>;
    platformInstall(request: core_pb.PlatformInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformInstallResp>;
    platformInstall(request: core_pb.PlatformInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformInstallResp>;
    platformDownload(request: core_pb.PlatformDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformDownloadResp>;
    platformDownload(request: core_pb.PlatformDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformDownloadResp>;
    platformUninstall(request: core_pb.PlatformUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUninstallResp>;
    platformUninstall(request: core_pb.PlatformUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUninstallResp>;
    platformUpgrade(request: core_pb.PlatformUpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUpgradeResp>;
    platformUpgrade(request: core_pb.PlatformUpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUpgradeResp>;
    upload(request: upload_pb.UploadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<upload_pb.UploadResp>;
    upload(request: upload_pb.UploadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<upload_pb.UploadResp>;
    platformSearch(request: core_pb.PlatformSearchReq, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformSearch(request: core_pb.PlatformSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformSearch(request: core_pb.PlatformSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformList(request: core_pb.PlatformListReq, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    platformList(request: core_pb.PlatformListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    platformList(request: core_pb.PlatformListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    libraryDownload(request: lib_pb.LibraryDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryDownloadResp>;
    libraryDownload(request: lib_pb.LibraryDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryDownloadResp>;
    libraryInstall(request: lib_pb.LibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryInstallResp>;
    libraryInstall(request: lib_pb.LibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryInstallResp>;
    libraryUninstall(request: lib_pb.LibraryUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUninstallResp>;
    libraryUninstall(request: lib_pb.LibraryUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUninstallResp>;
    libraryUpgradeAll(request: lib_pb.LibraryUpgradeAllReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUpgradeAllResp>;
    libraryUpgradeAll(request: lib_pb.LibraryUpgradeAllReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUpgradeAllResp>;
    librarySearch(request: lib_pb.LibrarySearchReq, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    librarySearch(request: lib_pb.LibrarySearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    librarySearch(request: lib_pb.LibrarySearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    libraryList(request: lib_pb.LibraryListReq, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    libraryList(request: lib_pb.LibraryListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    libraryList(request: lib_pb.LibraryListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
}

export class ArduinoCoreClient extends grpc.Client implements IArduinoCoreClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
    public init(request: commands_pb.InitReq, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    public init(request: commands_pb.InitReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    public init(request: commands_pb.InitReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.InitResp) => void): grpc.ClientUnaryCall;
    public destroy(request: commands_pb.DestroyReq, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public destroy(request: commands_pb.DestroyReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public destroy(request: commands_pb.DestroyReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_pb.RescanReq, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_pb.RescanReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_pb.RescanReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public updateIndex(request: commands_pb.UpdateIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_pb.UpdateIndexResp>;
    public updateIndex(request: commands_pb.UpdateIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_pb.UpdateIndexResp>;
    public boardList(request: board_pb.BoardListReq, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardList(request: board_pb.BoardListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardList(request: board_pb.BoardListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: board_pb.BoardDetailsReq, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: board_pb.BoardDetailsReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: board_pb.BoardDetailsReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public compile(request: compile_pb.CompileReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<compile_pb.CompileResp>;
    public compile(request: compile_pb.CompileReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<compile_pb.CompileResp>;
    public platformInstall(request: core_pb.PlatformInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformInstallResp>;
    public platformInstall(request: core_pb.PlatformInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformInstallResp>;
    public platformDownload(request: core_pb.PlatformDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformDownloadResp>;
    public platformDownload(request: core_pb.PlatformDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformDownloadResp>;
    public platformUninstall(request: core_pb.PlatformUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUninstallResp>;
    public platformUninstall(request: core_pb.PlatformUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUninstallResp>;
    public platformUpgrade(request: core_pb.PlatformUpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUpgradeResp>;
    public platformUpgrade(request: core_pb.PlatformUpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<core_pb.PlatformUpgradeResp>;
    public upload(request: upload_pb.UploadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<upload_pb.UploadResp>;
    public upload(request: upload_pb.UploadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<upload_pb.UploadResp>;
    public platformSearch(request: core_pb.PlatformSearchReq, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformSearch(request: core_pb.PlatformSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformSearch(request: core_pb.PlatformSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformList(request: core_pb.PlatformListReq, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public platformList(request: core_pb.PlatformListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public platformList(request: core_pb.PlatformListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public libraryDownload(request: lib_pb.LibraryDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryDownloadResp>;
    public libraryDownload(request: lib_pb.LibraryDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryDownloadResp>;
    public libraryInstall(request: lib_pb.LibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryInstallResp>;
    public libraryInstall(request: lib_pb.LibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryInstallResp>;
    public libraryUninstall(request: lib_pb.LibraryUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUninstallResp>;
    public libraryUninstall(request: lib_pb.LibraryUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUninstallResp>;
    public libraryUpgradeAll(request: lib_pb.LibraryUpgradeAllReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUpgradeAllResp>;
    public libraryUpgradeAll(request: lib_pb.LibraryUpgradeAllReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<lib_pb.LibraryUpgradeAllResp>;
    public librarySearch(request: lib_pb.LibrarySearchReq, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public librarySearch(request: lib_pb.LibrarySearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public librarySearch(request: lib_pb.LibrarySearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: lib_pb.LibraryListReq, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: lib_pb.LibraryListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: lib_pb.LibraryListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
}
