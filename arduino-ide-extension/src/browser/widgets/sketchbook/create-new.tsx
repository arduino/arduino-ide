import React from '@theia/core/shared/react';

export class CreateNew extends React.Component<CreateNew.Props> {
  override render(): React.ReactNode {
    return (
      <div className="create-new">
        <button className="theia-button secondary" onClick={this.props.onClick}>
          {this.props.label}
        </button>
      </div>
    );
  }
}

export namespace CreateNew {
  export interface Props {
    readonly label: string;
    readonly onClick: () => void;
  }
}
