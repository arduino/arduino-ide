import type {
  Port as APIPort,
  BoardDetails as ApiBoardDetails,
  BuildProperties as ApiBuildProperties,
  CompileSummary as ApiCompileSummary,
  ConfigOption as ApiConfigOption,
  ConfigValue as ApiConfigValue,
  Tool as ApiTool,
} from 'vscode-arduino-api';
import type {
  BoardDetails,
  CompileSummary,
  ConfigOption,
  ConfigValue,
  Port,
  Tool,
} from '../protocol';

export function toApiCompileSummary(
  compileSummary: CompileSummary
): ApiCompileSummary {
  const {
    buildPath,
    buildProperties,
    boardPlatform,
    buildPlatform,
    executableSectionsSize,
    usedLibraries,
  } = compileSummary;
  return {
    buildPath,
    buildProperties: toApiBuildProperties(buildProperties),
    executableSectionsSize: executableSectionsSize,
    boardPlatform,
    buildPlatform,
    usedLibraries,
  };
}

export function toApiPort(port: Port): APIPort | undefined {
  const {
    hardwareId = '',
    properties = {},
    address,
    protocol,
    protocolLabel,
    addressLabel: label,
  } = port;
  return {
    label,
    address,
    hardwareId,
    properties,
    protocol,
    protocolLabel,
  };
}

export function toApiBoardDetails(boardDetails: BoardDetails): ApiBoardDetails {
  const { fqbn, programmers, configOptions, requiredTools } = boardDetails;
  return {
    buildProperties: toApiBuildProperties(boardDetails.buildProperties),
    configOptions: configOptions.map(toApiConfigOption),
    fqbn,
    programmers,
    toolsDependencies: requiredTools.map(toApiTool),
  };
}

function toApiConfigOption(configOption: ConfigOption): ApiConfigOption {
  const { label, values, option } = configOption;
  return {
    optionLabel: label,
    option,
    values: values.map(toApiConfigValue),
  };
}

function toApiConfigValue(configValue: ConfigValue): ApiConfigValue {
  const { label, selected, value } = configValue;
  return {
    selected,
    value,
    valueLabel: label,
  };
}

function toApiTool(toolDependency: Tool): ApiTool {
  const { name, packager, version } = toolDependency;
  return {
    name,
    packager,
    version,
  };
}

const propertySep = '=';

function parseProperty(
  property: string
): [key: string, value: string] | undefined {
  const segments = property.split(propertySep);
  if (segments.length < 2) {
    console.warn(`Could not parse build property: ${property}.`);
    return undefined;
  }

  const [key, ...rest] = segments;
  if (!key) {
    console.warn(`Could not determine property key from raw: ${property}.`);
    return undefined;
  }
  const value = rest.join(propertySep);
  return [key, value];
}

export function toApiBuildProperties(properties: string[]): ApiBuildProperties {
  return properties.reduce((acc, curr) => {
    const entry = parseProperty(curr);
    if (entry) {
      const [key, value] = entry;
      acc[key] = value;
    }
    return acc;
  }, <Record<string, string>>{});
}
