// package: cc.arduino.cli.commands
// file: commands/commands.proto

/* tslint:disable */
/* eslint-disable */

import * as grpc from "@grpc/grpc-js";
import {handleClientStreamingCall} from "@grpc/grpc-js/build/src/server-call";
import * as commands_commands_pb from "../commands/commands_pb";
import * as commands_common_pb from "../commands/common_pb";
import * as commands_board_pb from "../commands/board_pb";
import * as commands_compile_pb from "../commands/compile_pb";
import * as commands_core_pb from "../commands/core_pb";
import * as commands_upload_pb from "../commands/upload_pb";
import * as commands_lib_pb from "../commands/lib_pb";

interface IArduinoCoreService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
    init: IArduinoCoreService_IInit;
    destroy: IArduinoCoreService_IDestroy;
    rescan: IArduinoCoreService_IRescan;
    updateIndex: IArduinoCoreService_IUpdateIndex;
    updateLibrariesIndex: IArduinoCoreService_IUpdateLibrariesIndex;
    updateCoreLibrariesIndex: IArduinoCoreService_IUpdateCoreLibrariesIndex;
    outdated: IArduinoCoreService_IOutdated;
    upgrade: IArduinoCoreService_IUpgrade;
    version: IArduinoCoreService_IVersion;
    loadSketch: IArduinoCoreService_ILoadSketch;
    archiveSketch: IArduinoCoreService_IArchiveSketch;
    boardDetails: IArduinoCoreService_IBoardDetails;
    boardAttach: IArduinoCoreService_IBoardAttach;
    boardList: IArduinoCoreService_IBoardList;
    boardListAll: IArduinoCoreService_IBoardListAll;
    boardSearch: IArduinoCoreService_IBoardSearch;
    boardListWatch: IArduinoCoreService_IBoardListWatch;
    compile: IArduinoCoreService_ICompile;
    platformInstall: IArduinoCoreService_IPlatformInstall;
    platformDownload: IArduinoCoreService_IPlatformDownload;
    platformUninstall: IArduinoCoreService_IPlatformUninstall;
    platformUpgrade: IArduinoCoreService_IPlatformUpgrade;
    upload: IArduinoCoreService_IUpload;
    uploadUsingProgrammer: IArduinoCoreService_IUploadUsingProgrammer;
    listProgrammersAvailableForUpload: IArduinoCoreService_IListProgrammersAvailableForUpload;
    burnBootloader: IArduinoCoreService_IBurnBootloader;
    platformSearch: IArduinoCoreService_IPlatformSearch;
    platformList: IArduinoCoreService_IPlatformList;
    libraryDownload: IArduinoCoreService_ILibraryDownload;
    libraryInstall: IArduinoCoreService_ILibraryInstall;
    zipLibraryInstall: IArduinoCoreService_IZipLibraryInstall;
    gitLibraryInstall: IArduinoCoreService_IGitLibraryInstall;
    libraryUninstall: IArduinoCoreService_ILibraryUninstall;
    libraryUpgradeAll: IArduinoCoreService_ILibraryUpgradeAll;
    libraryResolveDependencies: IArduinoCoreService_ILibraryResolveDependencies;
    librarySearch: IArduinoCoreService_ILibrarySearch;
    libraryList: IArduinoCoreService_ILibraryList;
}

interface IArduinoCoreService_IInit extends grpc.MethodDefinition<commands_commands_pb.InitReq, commands_commands_pb.InitResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Init";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_commands_pb.InitReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.InitReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.InitResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.InitResp>;
}
interface IArduinoCoreService_IDestroy extends grpc.MethodDefinition<commands_commands_pb.DestroyReq, commands_commands_pb.DestroyResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Destroy";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.DestroyReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.DestroyReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.DestroyResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.DestroyResp>;
}
interface IArduinoCoreService_IRescan extends grpc.MethodDefinition<commands_commands_pb.RescanReq, commands_commands_pb.RescanResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Rescan";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.RescanReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.RescanReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.RescanResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.RescanResp>;
}
interface IArduinoCoreService_IUpdateIndex extends grpc.MethodDefinition<commands_commands_pb.UpdateIndexReq, commands_commands_pb.UpdateIndexResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/UpdateIndex";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_commands_pb.UpdateIndexReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.UpdateIndexReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.UpdateIndexResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.UpdateIndexResp>;
}
interface IArduinoCoreService_IUpdateLibrariesIndex extends grpc.MethodDefinition<commands_commands_pb.UpdateLibrariesIndexReq, commands_commands_pb.UpdateLibrariesIndexResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/UpdateLibrariesIndex";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_commands_pb.UpdateLibrariesIndexReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.UpdateLibrariesIndexReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.UpdateLibrariesIndexResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.UpdateLibrariesIndexResp>;
}
interface IArduinoCoreService_IUpdateCoreLibrariesIndex extends grpc.MethodDefinition<commands_commands_pb.UpdateCoreLibrariesIndexReq, commands_commands_pb.UpdateCoreLibrariesIndexResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/UpdateCoreLibrariesIndex";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_commands_pb.UpdateCoreLibrariesIndexReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.UpdateCoreLibrariesIndexReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
}
interface IArduinoCoreService_IOutdated extends grpc.MethodDefinition<commands_commands_pb.OutdatedReq, commands_commands_pb.OutdatedResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Outdated";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.OutdatedReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.OutdatedReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.OutdatedResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.OutdatedResp>;
}
interface IArduinoCoreService_IUpgrade extends grpc.MethodDefinition<commands_commands_pb.UpgradeReq, commands_commands_pb.UpgradeResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Upgrade";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_commands_pb.UpgradeReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.UpgradeReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.UpgradeResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.UpgradeResp>;
}
interface IArduinoCoreService_IVersion extends grpc.MethodDefinition<commands_commands_pb.VersionReq, commands_commands_pb.VersionResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Version";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.VersionReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.VersionReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.VersionResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.VersionResp>;
}
interface IArduinoCoreService_ILoadSketch extends grpc.MethodDefinition<commands_commands_pb.LoadSketchReq, commands_commands_pb.LoadSketchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LoadSketch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.LoadSketchReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.LoadSketchReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.LoadSketchResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.LoadSketchResp>;
}
interface IArduinoCoreService_IArchiveSketch extends grpc.MethodDefinition<commands_commands_pb.ArchiveSketchReq, commands_commands_pb.ArchiveSketchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/ArchiveSketch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_commands_pb.ArchiveSketchReq>;
    requestDeserialize: grpc.deserialize<commands_commands_pb.ArchiveSketchReq>;
    responseSerialize: grpc.serialize<commands_commands_pb.ArchiveSketchResp>;
    responseDeserialize: grpc.deserialize<commands_commands_pb.ArchiveSketchResp>;
}
interface IArduinoCoreService_IBoardDetails extends grpc.MethodDefinition<commands_board_pb.BoardDetailsReq, commands_board_pb.BoardDetailsResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardDetails";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_board_pb.BoardDetailsReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardDetailsReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardDetailsResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardDetailsResp>;
}
interface IArduinoCoreService_IBoardAttach extends grpc.MethodDefinition<commands_board_pb.BoardAttachReq, commands_board_pb.BoardAttachResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardAttach";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_board_pb.BoardAttachReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardAttachReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardAttachResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardAttachResp>;
}
interface IArduinoCoreService_IBoardList extends grpc.MethodDefinition<commands_board_pb.BoardListReq, commands_board_pb.BoardListResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_board_pb.BoardListReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardListReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardListResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardListResp>;
}
interface IArduinoCoreService_IBoardListAll extends grpc.MethodDefinition<commands_board_pb.BoardListAllReq, commands_board_pb.BoardListAllResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardListAll";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_board_pb.BoardListAllReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardListAllReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardListAllResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardListAllResp>;
}
interface IArduinoCoreService_IBoardSearch extends grpc.MethodDefinition<commands_board_pb.BoardSearchReq, commands_board_pb.BoardSearchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardSearch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_board_pb.BoardSearchReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardSearchReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardSearchResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardSearchResp>;
}
interface IArduinoCoreService_IBoardListWatch extends grpc.MethodDefinition<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BoardListWatch";
    requestStream: true;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_board_pb.BoardListWatchReq>;
    requestDeserialize: grpc.deserialize<commands_board_pb.BoardListWatchReq>;
    responseSerialize: grpc.serialize<commands_board_pb.BoardListWatchResp>;
    responseDeserialize: grpc.deserialize<commands_board_pb.BoardListWatchResp>;
}
interface IArduinoCoreService_ICompile extends grpc.MethodDefinition<commands_compile_pb.CompileReq, commands_compile_pb.CompileResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Compile";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_compile_pb.CompileReq>;
    requestDeserialize: grpc.deserialize<commands_compile_pb.CompileReq>;
    responseSerialize: grpc.serialize<commands_compile_pb.CompileResp>;
    responseDeserialize: grpc.deserialize<commands_compile_pb.CompileResp>;
}
interface IArduinoCoreService_IPlatformInstall extends grpc.MethodDefinition<commands_core_pb.PlatformInstallReq, commands_core_pb.PlatformInstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformInstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformInstallReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformInstallReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformInstallResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformInstallResp>;
}
interface IArduinoCoreService_IPlatformDownload extends grpc.MethodDefinition<commands_core_pb.PlatformDownloadReq, commands_core_pb.PlatformDownloadResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformDownload";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformDownloadReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformDownloadReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformDownloadResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformDownloadResp>;
}
interface IArduinoCoreService_IPlatformUninstall extends grpc.MethodDefinition<commands_core_pb.PlatformUninstallReq, commands_core_pb.PlatformUninstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformUninstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformUninstallReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformUninstallReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformUninstallResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformUninstallResp>;
}
interface IArduinoCoreService_IPlatformUpgrade extends grpc.MethodDefinition<commands_core_pb.PlatformUpgradeReq, commands_core_pb.PlatformUpgradeResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformUpgrade";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformUpgradeReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformUpgradeReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformUpgradeResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformUpgradeResp>;
}
interface IArduinoCoreService_IUpload extends grpc.MethodDefinition<commands_upload_pb.UploadReq, commands_upload_pb.UploadResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/Upload";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_upload_pb.UploadReq>;
    requestDeserialize: grpc.deserialize<commands_upload_pb.UploadReq>;
    responseSerialize: grpc.serialize<commands_upload_pb.UploadResp>;
    responseDeserialize: grpc.deserialize<commands_upload_pb.UploadResp>;
}
interface IArduinoCoreService_IUploadUsingProgrammer extends grpc.MethodDefinition<commands_upload_pb.UploadUsingProgrammerReq, commands_upload_pb.UploadUsingProgrammerResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/UploadUsingProgrammer";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_upload_pb.UploadUsingProgrammerReq>;
    requestDeserialize: grpc.deserialize<commands_upload_pb.UploadUsingProgrammerReq>;
    responseSerialize: grpc.serialize<commands_upload_pb.UploadUsingProgrammerResp>;
    responseDeserialize: grpc.deserialize<commands_upload_pb.UploadUsingProgrammerResp>;
}
interface IArduinoCoreService_IListProgrammersAvailableForUpload extends grpc.MethodDefinition<commands_upload_pb.ListProgrammersAvailableForUploadReq, commands_upload_pb.ListProgrammersAvailableForUploadResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/ListProgrammersAvailableForUpload";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_upload_pb.ListProgrammersAvailableForUploadReq>;
    requestDeserialize: grpc.deserialize<commands_upload_pb.ListProgrammersAvailableForUploadReq>;
    responseSerialize: grpc.serialize<commands_upload_pb.ListProgrammersAvailableForUploadResp>;
    responseDeserialize: grpc.deserialize<commands_upload_pb.ListProgrammersAvailableForUploadResp>;
}
interface IArduinoCoreService_IBurnBootloader extends grpc.MethodDefinition<commands_upload_pb.BurnBootloaderReq, commands_upload_pb.BurnBootloaderResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/BurnBootloader";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_upload_pb.BurnBootloaderReq>;
    requestDeserialize: grpc.deserialize<commands_upload_pb.BurnBootloaderReq>;
    responseSerialize: grpc.serialize<commands_upload_pb.BurnBootloaderResp>;
    responseDeserialize: grpc.deserialize<commands_upload_pb.BurnBootloaderResp>;
}
interface IArduinoCoreService_IPlatformSearch extends grpc.MethodDefinition<commands_core_pb.PlatformSearchReq, commands_core_pb.PlatformSearchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformSearch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformSearchReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformSearchReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformSearchResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformSearchResp>;
}
interface IArduinoCoreService_IPlatformList extends grpc.MethodDefinition<commands_core_pb.PlatformListReq, commands_core_pb.PlatformListResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/PlatformList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_core_pb.PlatformListReq>;
    requestDeserialize: grpc.deserialize<commands_core_pb.PlatformListReq>;
    responseSerialize: grpc.serialize<commands_core_pb.PlatformListResp>;
    responseDeserialize: grpc.deserialize<commands_core_pb.PlatformListResp>;
}
interface IArduinoCoreService_ILibraryDownload extends grpc.MethodDefinition<commands_lib_pb.LibraryDownloadReq, commands_lib_pb.LibraryDownloadResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryDownload";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryDownloadReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryDownloadReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryDownloadResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryDownloadResp>;
}
interface IArduinoCoreService_ILibraryInstall extends grpc.MethodDefinition<commands_lib_pb.LibraryInstallReq, commands_lib_pb.LibraryInstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryInstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryInstallReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryInstallReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryInstallResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryInstallResp>;
}
interface IArduinoCoreService_IZipLibraryInstall extends grpc.MethodDefinition<commands_lib_pb.ZipLibraryInstallReq, commands_lib_pb.ZipLibraryInstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/ZipLibraryInstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.ZipLibraryInstallReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.ZipLibraryInstallReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.ZipLibraryInstallResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.ZipLibraryInstallResp>;
}
interface IArduinoCoreService_IGitLibraryInstall extends grpc.MethodDefinition<commands_lib_pb.GitLibraryInstallReq, commands_lib_pb.GitLibraryInstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/GitLibraryInstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.GitLibraryInstallReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.GitLibraryInstallReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.GitLibraryInstallResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.GitLibraryInstallResp>;
}
interface IArduinoCoreService_ILibraryUninstall extends grpc.MethodDefinition<commands_lib_pb.LibraryUninstallReq, commands_lib_pb.LibraryUninstallResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryUninstall";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryUninstallReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryUninstallReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryUninstallResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryUninstallResp>;
}
interface IArduinoCoreService_ILibraryUpgradeAll extends grpc.MethodDefinition<commands_lib_pb.LibraryUpgradeAllReq, commands_lib_pb.LibraryUpgradeAllResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryUpgradeAll";
    requestStream: false;
    responseStream: true;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryUpgradeAllReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryUpgradeAllReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryUpgradeAllResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryUpgradeAllResp>;
}
interface IArduinoCoreService_ILibraryResolveDependencies extends grpc.MethodDefinition<commands_lib_pb.LibraryResolveDependenciesReq, commands_lib_pb.LibraryResolveDependenciesResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryResolveDependencies";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryResolveDependenciesReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryResolveDependenciesReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryResolveDependenciesResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryResolveDependenciesResp>;
}
interface IArduinoCoreService_ILibrarySearch extends grpc.MethodDefinition<commands_lib_pb.LibrarySearchReq, commands_lib_pb.LibrarySearchResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibrarySearch";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_lib_pb.LibrarySearchReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibrarySearchReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibrarySearchResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibrarySearchResp>;
}
interface IArduinoCoreService_ILibraryList extends grpc.MethodDefinition<commands_lib_pb.LibraryListReq, commands_lib_pb.LibraryListResp> {
    path: "/cc.arduino.cli.commands.ArduinoCore/LibraryList";
    requestStream: false;
    responseStream: false;
    requestSerialize: grpc.serialize<commands_lib_pb.LibraryListReq>;
    requestDeserialize: grpc.deserialize<commands_lib_pb.LibraryListReq>;
    responseSerialize: grpc.serialize<commands_lib_pb.LibraryListResp>;
    responseDeserialize: grpc.deserialize<commands_lib_pb.LibraryListResp>;
}

export const ArduinoCoreService: IArduinoCoreService;

export interface IArduinoCoreServer {
    init: grpc.handleServerStreamingCall<commands_commands_pb.InitReq, commands_commands_pb.InitResp>;
    destroy: grpc.handleUnaryCall<commands_commands_pb.DestroyReq, commands_commands_pb.DestroyResp>;
    rescan: grpc.handleUnaryCall<commands_commands_pb.RescanReq, commands_commands_pb.RescanResp>;
    updateIndex: grpc.handleServerStreamingCall<commands_commands_pb.UpdateIndexReq, commands_commands_pb.UpdateIndexResp>;
    updateLibrariesIndex: grpc.handleServerStreamingCall<commands_commands_pb.UpdateLibrariesIndexReq, commands_commands_pb.UpdateLibrariesIndexResp>;
    updateCoreLibrariesIndex: grpc.handleServerStreamingCall<commands_commands_pb.UpdateCoreLibrariesIndexReq, commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    outdated: grpc.handleUnaryCall<commands_commands_pb.OutdatedReq, commands_commands_pb.OutdatedResp>;
    upgrade: grpc.handleServerStreamingCall<commands_commands_pb.UpgradeReq, commands_commands_pb.UpgradeResp>;
    version: grpc.handleUnaryCall<commands_commands_pb.VersionReq, commands_commands_pb.VersionResp>;
    loadSketch: grpc.handleUnaryCall<commands_commands_pb.LoadSketchReq, commands_commands_pb.LoadSketchResp>;
    archiveSketch: grpc.handleUnaryCall<commands_commands_pb.ArchiveSketchReq, commands_commands_pb.ArchiveSketchResp>;
    boardDetails: grpc.handleUnaryCall<commands_board_pb.BoardDetailsReq, commands_board_pb.BoardDetailsResp>;
    boardAttach: grpc.handleServerStreamingCall<commands_board_pb.BoardAttachReq, commands_board_pb.BoardAttachResp>;
    boardList: grpc.handleUnaryCall<commands_board_pb.BoardListReq, commands_board_pb.BoardListResp>;
    boardListAll: grpc.handleUnaryCall<commands_board_pb.BoardListAllReq, commands_board_pb.BoardListAllResp>;
    boardSearch: grpc.handleUnaryCall<commands_board_pb.BoardSearchReq, commands_board_pb.BoardSearchResp>;
    boardListWatch: grpc.handleBidiStreamingCall<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    compile: grpc.handleServerStreamingCall<commands_compile_pb.CompileReq, commands_compile_pb.CompileResp>;
    platformInstall: grpc.handleServerStreamingCall<commands_core_pb.PlatformInstallReq, commands_core_pb.PlatformInstallResp>;
    platformDownload: grpc.handleServerStreamingCall<commands_core_pb.PlatformDownloadReq, commands_core_pb.PlatformDownloadResp>;
    platformUninstall: grpc.handleServerStreamingCall<commands_core_pb.PlatformUninstallReq, commands_core_pb.PlatformUninstallResp>;
    platformUpgrade: grpc.handleServerStreamingCall<commands_core_pb.PlatformUpgradeReq, commands_core_pb.PlatformUpgradeResp>;
    upload: grpc.handleServerStreamingCall<commands_upload_pb.UploadReq, commands_upload_pb.UploadResp>;
    uploadUsingProgrammer: grpc.handleServerStreamingCall<commands_upload_pb.UploadUsingProgrammerReq, commands_upload_pb.UploadUsingProgrammerResp>;
    listProgrammersAvailableForUpload: grpc.handleUnaryCall<commands_upload_pb.ListProgrammersAvailableForUploadReq, commands_upload_pb.ListProgrammersAvailableForUploadResp>;
    burnBootloader: grpc.handleServerStreamingCall<commands_upload_pb.BurnBootloaderReq, commands_upload_pb.BurnBootloaderResp>;
    platformSearch: grpc.handleUnaryCall<commands_core_pb.PlatformSearchReq, commands_core_pb.PlatformSearchResp>;
    platformList: grpc.handleUnaryCall<commands_core_pb.PlatformListReq, commands_core_pb.PlatformListResp>;
    libraryDownload: grpc.handleServerStreamingCall<commands_lib_pb.LibraryDownloadReq, commands_lib_pb.LibraryDownloadResp>;
    libraryInstall: grpc.handleServerStreamingCall<commands_lib_pb.LibraryInstallReq, commands_lib_pb.LibraryInstallResp>;
    zipLibraryInstall: grpc.handleServerStreamingCall<commands_lib_pb.ZipLibraryInstallReq, commands_lib_pb.ZipLibraryInstallResp>;
    gitLibraryInstall: grpc.handleServerStreamingCall<commands_lib_pb.GitLibraryInstallReq, commands_lib_pb.GitLibraryInstallResp>;
    libraryUninstall: grpc.handleServerStreamingCall<commands_lib_pb.LibraryUninstallReq, commands_lib_pb.LibraryUninstallResp>;
    libraryUpgradeAll: grpc.handleServerStreamingCall<commands_lib_pb.LibraryUpgradeAllReq, commands_lib_pb.LibraryUpgradeAllResp>;
    libraryResolveDependencies: grpc.handleUnaryCall<commands_lib_pb.LibraryResolveDependenciesReq, commands_lib_pb.LibraryResolveDependenciesResp>;
    librarySearch: grpc.handleUnaryCall<commands_lib_pb.LibrarySearchReq, commands_lib_pb.LibrarySearchResp>;
    libraryList: grpc.handleUnaryCall<commands_lib_pb.LibraryListReq, commands_lib_pb.LibraryListResp>;
}

export interface IArduinoCoreClient {
    init(request: commands_commands_pb.InitReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.InitResp>;
    init(request: commands_commands_pb.InitReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.InitResp>;
    destroy(request: commands_commands_pb.DestroyReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    destroy(request: commands_commands_pb.DestroyReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    destroy(request: commands_commands_pb.DestroyReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_commands_pb.RescanReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_commands_pb.RescanReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    rescan(request: commands_commands_pb.RescanReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    updateIndex(request: commands_commands_pb.UpdateIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateIndexResp>;
    updateIndex(request: commands_commands_pb.UpdateIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateIndexResp>;
    updateLibrariesIndex(request: commands_commands_pb.UpdateLibrariesIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateLibrariesIndexResp>;
    updateLibrariesIndex(request: commands_commands_pb.UpdateLibrariesIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateLibrariesIndexResp>;
    updateCoreLibrariesIndex(request: commands_commands_pb.UpdateCoreLibrariesIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    updateCoreLibrariesIndex(request: commands_commands_pb.UpdateCoreLibrariesIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    outdated(request: commands_commands_pb.OutdatedReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    outdated(request: commands_commands_pb.OutdatedReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    outdated(request: commands_commands_pb.OutdatedReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    upgrade(request: commands_commands_pb.UpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpgradeResp>;
    upgrade(request: commands_commands_pb.UpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpgradeResp>;
    version(request: commands_commands_pb.VersionReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    version(request: commands_commands_pb.VersionReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    version(request: commands_commands_pb.VersionReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    loadSketch(request: commands_commands_pb.LoadSketchReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    loadSketch(request: commands_commands_pb.LoadSketchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    loadSketch(request: commands_commands_pb.LoadSketchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    archiveSketch(request: commands_commands_pb.ArchiveSketchReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    archiveSketch(request: commands_commands_pb.ArchiveSketchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    archiveSketch(request: commands_commands_pb.ArchiveSketchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: commands_board_pb.BoardDetailsReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: commands_board_pb.BoardDetailsReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    boardDetails(request: commands_board_pb.BoardDetailsReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    boardAttach(request: commands_board_pb.BoardAttachReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_board_pb.BoardAttachResp>;
    boardAttach(request: commands_board_pb.BoardAttachReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_board_pb.BoardAttachResp>;
    boardList(request: commands_board_pb.BoardListReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardList(request: commands_board_pb.BoardListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardList(request: commands_board_pb.BoardListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    boardListAll(request: commands_board_pb.BoardListAllReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    boardListAll(request: commands_board_pb.BoardListAllReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    boardListAll(request: commands_board_pb.BoardListAllReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    boardSearch(request: commands_board_pb.BoardSearchReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    boardSearch(request: commands_board_pb.BoardSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    boardSearch(request: commands_board_pb.BoardSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    boardListWatch(): grpc.ClientDuplexStream<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    boardListWatch(options: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    boardListWatch(metadata: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    compile(request: commands_compile_pb.CompileReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_compile_pb.CompileResp>;
    compile(request: commands_compile_pb.CompileReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_compile_pb.CompileResp>;
    platformInstall(request: commands_core_pb.PlatformInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformInstallResp>;
    platformInstall(request: commands_core_pb.PlatformInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformInstallResp>;
    platformDownload(request: commands_core_pb.PlatformDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformDownloadResp>;
    platformDownload(request: commands_core_pb.PlatformDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformDownloadResp>;
    platformUninstall(request: commands_core_pb.PlatformUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUninstallResp>;
    platformUninstall(request: commands_core_pb.PlatformUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUninstallResp>;
    platformUpgrade(request: commands_core_pb.PlatformUpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUpgradeResp>;
    platformUpgrade(request: commands_core_pb.PlatformUpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUpgradeResp>;
    upload(request: commands_upload_pb.UploadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadResp>;
    upload(request: commands_upload_pb.UploadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadResp>;
    uploadUsingProgrammer(request: commands_upload_pb.UploadUsingProgrammerReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadUsingProgrammerResp>;
    uploadUsingProgrammer(request: commands_upload_pb.UploadUsingProgrammerReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadUsingProgrammerResp>;
    listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    burnBootloader(request: commands_upload_pb.BurnBootloaderReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.BurnBootloaderResp>;
    burnBootloader(request: commands_upload_pb.BurnBootloaderReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.BurnBootloaderResp>;
    platformSearch(request: commands_core_pb.PlatformSearchReq, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformSearch(request: commands_core_pb.PlatformSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformSearch(request: commands_core_pb.PlatformSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    platformList(request: commands_core_pb.PlatformListReq, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    platformList(request: commands_core_pb.PlatformListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    platformList(request: commands_core_pb.PlatformListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    libraryDownload(request: commands_lib_pb.LibraryDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryDownloadResp>;
    libraryDownload(request: commands_lib_pb.LibraryDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryDownloadResp>;
    libraryInstall(request: commands_lib_pb.LibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryInstallResp>;
    libraryInstall(request: commands_lib_pb.LibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryInstallResp>;
    zipLibraryInstall(request: commands_lib_pb.ZipLibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.ZipLibraryInstallResp>;
    zipLibraryInstall(request: commands_lib_pb.ZipLibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.ZipLibraryInstallResp>;
    gitLibraryInstall(request: commands_lib_pb.GitLibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.GitLibraryInstallResp>;
    gitLibraryInstall(request: commands_lib_pb.GitLibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.GitLibraryInstallResp>;
    libraryUninstall(request: commands_lib_pb.LibraryUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUninstallResp>;
    libraryUninstall(request: commands_lib_pb.LibraryUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUninstallResp>;
    libraryUpgradeAll(request: commands_lib_pb.LibraryUpgradeAllReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUpgradeAllResp>;
    libraryUpgradeAll(request: commands_lib_pb.LibraryUpgradeAllReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUpgradeAllResp>;
    libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    librarySearch(request: commands_lib_pb.LibrarySearchReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    librarySearch(request: commands_lib_pb.LibrarySearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    librarySearch(request: commands_lib_pb.LibrarySearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    libraryList(request: commands_lib_pb.LibraryListReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    libraryList(request: commands_lib_pb.LibraryListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    libraryList(request: commands_lib_pb.LibraryListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
}

export class ArduinoCoreClient extends grpc.Client implements IArduinoCoreClient {
    constructor(address: string, credentials: grpc.ChannelCredentials, options?: Partial<grpc.ClientOptions>);
    public init(request: commands_commands_pb.InitReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.InitResp>;
    public init(request: commands_commands_pb.InitReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.InitResp>;
    public destroy(request: commands_commands_pb.DestroyReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public destroy(request: commands_commands_pb.DestroyReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public destroy(request: commands_commands_pb.DestroyReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.DestroyResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_commands_pb.RescanReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_commands_pb.RescanReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public rescan(request: commands_commands_pb.RescanReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.RescanResp) => void): grpc.ClientUnaryCall;
    public updateIndex(request: commands_commands_pb.UpdateIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateIndexResp>;
    public updateIndex(request: commands_commands_pb.UpdateIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateIndexResp>;
    public updateLibrariesIndex(request: commands_commands_pb.UpdateLibrariesIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateLibrariesIndexResp>;
    public updateLibrariesIndex(request: commands_commands_pb.UpdateLibrariesIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateLibrariesIndexResp>;
    public updateCoreLibrariesIndex(request: commands_commands_pb.UpdateCoreLibrariesIndexReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    public updateCoreLibrariesIndex(request: commands_commands_pb.UpdateCoreLibrariesIndexReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpdateCoreLibrariesIndexResp>;
    public outdated(request: commands_commands_pb.OutdatedReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    public outdated(request: commands_commands_pb.OutdatedReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    public outdated(request: commands_commands_pb.OutdatedReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.OutdatedResp) => void): grpc.ClientUnaryCall;
    public upgrade(request: commands_commands_pb.UpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpgradeResp>;
    public upgrade(request: commands_commands_pb.UpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_commands_pb.UpgradeResp>;
    public version(request: commands_commands_pb.VersionReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    public version(request: commands_commands_pb.VersionReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    public version(request: commands_commands_pb.VersionReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.VersionResp) => void): grpc.ClientUnaryCall;
    public loadSketch(request: commands_commands_pb.LoadSketchReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    public loadSketch(request: commands_commands_pb.LoadSketchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    public loadSketch(request: commands_commands_pb.LoadSketchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.LoadSketchResp) => void): grpc.ClientUnaryCall;
    public archiveSketch(request: commands_commands_pb.ArchiveSketchReq, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    public archiveSketch(request: commands_commands_pb.ArchiveSketchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    public archiveSketch(request: commands_commands_pb.ArchiveSketchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_commands_pb.ArchiveSketchResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: commands_board_pb.BoardDetailsReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: commands_board_pb.BoardDetailsReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public boardDetails(request: commands_board_pb.BoardDetailsReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardDetailsResp) => void): grpc.ClientUnaryCall;
    public boardAttach(request: commands_board_pb.BoardAttachReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_board_pb.BoardAttachResp>;
    public boardAttach(request: commands_board_pb.BoardAttachReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_board_pb.BoardAttachResp>;
    public boardList(request: commands_board_pb.BoardListReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardList(request: commands_board_pb.BoardListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardList(request: commands_board_pb.BoardListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListResp) => void): grpc.ClientUnaryCall;
    public boardListAll(request: commands_board_pb.BoardListAllReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    public boardListAll(request: commands_board_pb.BoardListAllReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    public boardListAll(request: commands_board_pb.BoardListAllReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardListAllResp) => void): grpc.ClientUnaryCall;
    public boardSearch(request: commands_board_pb.BoardSearchReq, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    public boardSearch(request: commands_board_pb.BoardSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    public boardSearch(request: commands_board_pb.BoardSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_board_pb.BoardSearchResp) => void): grpc.ClientUnaryCall;
    public boardListWatch(options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    public boardListWatch(metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientDuplexStream<commands_board_pb.BoardListWatchReq, commands_board_pb.BoardListWatchResp>;
    public compile(request: commands_compile_pb.CompileReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_compile_pb.CompileResp>;
    public compile(request: commands_compile_pb.CompileReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_compile_pb.CompileResp>;
    public platformInstall(request: commands_core_pb.PlatformInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformInstallResp>;
    public platformInstall(request: commands_core_pb.PlatformInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformInstallResp>;
    public platformDownload(request: commands_core_pb.PlatformDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformDownloadResp>;
    public platformDownload(request: commands_core_pb.PlatformDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformDownloadResp>;
    public platformUninstall(request: commands_core_pb.PlatformUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUninstallResp>;
    public platformUninstall(request: commands_core_pb.PlatformUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUninstallResp>;
    public platformUpgrade(request: commands_core_pb.PlatformUpgradeReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUpgradeResp>;
    public platformUpgrade(request: commands_core_pb.PlatformUpgradeReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_core_pb.PlatformUpgradeResp>;
    public upload(request: commands_upload_pb.UploadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadResp>;
    public upload(request: commands_upload_pb.UploadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadResp>;
    public uploadUsingProgrammer(request: commands_upload_pb.UploadUsingProgrammerReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadUsingProgrammerResp>;
    public uploadUsingProgrammer(request: commands_upload_pb.UploadUsingProgrammerReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.UploadUsingProgrammerResp>;
    public listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    public listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    public listProgrammersAvailableForUpload(request: commands_upload_pb.ListProgrammersAvailableForUploadReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_upload_pb.ListProgrammersAvailableForUploadResp) => void): grpc.ClientUnaryCall;
    public burnBootloader(request: commands_upload_pb.BurnBootloaderReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.BurnBootloaderResp>;
    public burnBootloader(request: commands_upload_pb.BurnBootloaderReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_upload_pb.BurnBootloaderResp>;
    public platformSearch(request: commands_core_pb.PlatformSearchReq, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformSearch(request: commands_core_pb.PlatformSearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformSearch(request: commands_core_pb.PlatformSearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformSearchResp) => void): grpc.ClientUnaryCall;
    public platformList(request: commands_core_pb.PlatformListReq, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public platformList(request: commands_core_pb.PlatformListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public platformList(request: commands_core_pb.PlatformListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_core_pb.PlatformListResp) => void): grpc.ClientUnaryCall;
    public libraryDownload(request: commands_lib_pb.LibraryDownloadReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryDownloadResp>;
    public libraryDownload(request: commands_lib_pb.LibraryDownloadReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryDownloadResp>;
    public libraryInstall(request: commands_lib_pb.LibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryInstallResp>;
    public libraryInstall(request: commands_lib_pb.LibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryInstallResp>;
    public zipLibraryInstall(request: commands_lib_pb.ZipLibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.ZipLibraryInstallResp>;
    public zipLibraryInstall(request: commands_lib_pb.ZipLibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.ZipLibraryInstallResp>;
    public gitLibraryInstall(request: commands_lib_pb.GitLibraryInstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.GitLibraryInstallResp>;
    public gitLibraryInstall(request: commands_lib_pb.GitLibraryInstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.GitLibraryInstallResp>;
    public libraryUninstall(request: commands_lib_pb.LibraryUninstallReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUninstallResp>;
    public libraryUninstall(request: commands_lib_pb.LibraryUninstallReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUninstallResp>;
    public libraryUpgradeAll(request: commands_lib_pb.LibraryUpgradeAllReq, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUpgradeAllResp>;
    public libraryUpgradeAll(request: commands_lib_pb.LibraryUpgradeAllReq, metadata?: grpc.Metadata, options?: Partial<grpc.CallOptions>): grpc.ClientReadableStream<commands_lib_pb.LibraryUpgradeAllResp>;
    public libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    public libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    public libraryResolveDependencies(request: commands_lib_pb.LibraryResolveDependenciesReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryResolveDependenciesResp) => void): grpc.ClientUnaryCall;
    public librarySearch(request: commands_lib_pb.LibrarySearchReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public librarySearch(request: commands_lib_pb.LibrarySearchReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public librarySearch(request: commands_lib_pb.LibrarySearchReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibrarySearchResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: commands_lib_pb.LibraryListReq, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: commands_lib_pb.LibraryListReq, metadata: grpc.Metadata, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
    public libraryList(request: commands_lib_pb.LibraryListReq, metadata: grpc.Metadata, options: Partial<grpc.CallOptions>, callback: (error: grpc.ServiceError | null, response: commands_lib_pb.LibraryListResp) => void): grpc.ClientUnaryCall;
}
