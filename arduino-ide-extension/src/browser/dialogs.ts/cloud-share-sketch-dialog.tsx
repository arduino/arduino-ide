import * as React from 'react';
import { inject, injectable } from 'inversify';
import { Widget } from '@phosphor/widgets';
import { Message } from '@phosphor/messaging';
import { clipboard } from 'electron';
import {
  AbstractDialog,
  ReactWidget,
  DialogProps,
} from '@theia/core/lib/browser';
import { CreateApi } from '../create/create-api';

const RadioButton = (props: {
  id: string;
  changed: (evt: React.BaseSyntheticEvent) => void;
  value: string;
  isSelected: boolean;
  isDisabled: boolean;
  label: string;
}) => {
  return (
    <p className="RadioButton">
      <input
        id={props.id}
        onChange={props.changed}
        value={props.value}
        type="radio"
        checked={props.isSelected}
        disabled={props.isDisabled}
      />
      <label htmlFor={props.id}>{props.label}</label>
    </p>
  );
};

export const ShareSketchComponent = ({
  treeNode,
  createApi,
  domain = 'https://create.arduino.cc',
}: {
  treeNode: any;
  createApi: CreateApi;
  domain?: string;
}): React.ReactElement => {
  // const [publicVisibility, setPublicVisibility] = React.useState<boolean>(
  //     treeNode.isPublic
  // );

  const [loading, setloading] = React.useState<boolean>(false);

  const radioChangeHandler = async (event: React.BaseSyntheticEvent) => {
    setloading(true);
    const sketch = await createApi.editSketch({
      id: treeNode.sketchId,
      params: {
        is_public: event.target.value === 'private' ? false : true,
      },
    });
    // setPublicVisibility(sketch.is_public);
    treeNode.isPublic = sketch.is_public;
    setloading(false);
  };

  const sketchLink = `${domain}/editor/_/${treeNode.sketchId}/preview`;
  const embedLink = `<iframe src="${sketchLink}?embed" style="height:510px;width:100%;margin:10px 0" frameborder=0></iframe>`;

  return (
    <div id="widget-container arduino-sharesketch-dialog">
      <p>Choose visibility of your Sketch:</p>
      <RadioButton
        changed={radioChangeHandler}
        id="1"
        isSelected={treeNode.isPublic === false}
        label="Private. Only you can view the Sketch."
        value="private"
        isDisabled={loading}
      />
      <RadioButton
        changed={radioChangeHandler}
        id="2"
        isSelected={treeNode.isPublic === true}
        label="Public. Anyone with the link can view the Sketch."
        value="public"
        isDisabled={loading}
      />

      {treeNode.isPublic && (
        <div>
          <p>Link:</p>
          <div className="sketch-link">
            <input
              type="text"
              readOnly
              value={sketchLink}
              className="theia-input"
            />
            <button
              onClick={() => clipboard.writeText(sketchLink)}
              value="copy"
              className="theia-button secondary"
            >
              Copy
            </button>
          </div>
          <p>Embed:</p>
          <div className="sketch-link-embed">
            <textarea
              readOnly
              value={embedLink}
              className="theia-input stretch"
            />
          </div>
        </div>
      )}
    </div>
  );
};

@injectable()
export class ShareSketchWidget extends ReactWidget {
  constructor(private treeNode: any, private createApi: CreateApi) {
    super();
  }

  protected render(): React.ReactNode {
    return (
      <ShareSketchComponent
        treeNode={this.treeNode}
        createApi={this.createApi}
      />
    );
  }
}

@injectable()
export class ShareSketchDialogProps extends DialogProps {
  readonly node: any;
  readonly createApi: CreateApi;
}

@injectable()
export class ShareSketchDialog extends AbstractDialog<void> {
  protected widget: ShareSketchWidget;

  constructor(
    @inject(ShareSketchDialogProps)
    protected readonly props: ShareSketchDialogProps
  ) {
    super({ title: props.title });
    this.contentNode.classList.add('arduino-share-sketch-dialog');
    this.widget = new ShareSketchWidget(props.node, props.createApi);
  }

  get value(): void {
    return;
  }
  protected onAfterAttach(msg: Message): void {
    if (this.widget.isAttached) {
      Widget.detach(this.widget);
    }
    Widget.attach(this.widget, this.contentNode);
    super.onAfterAttach(msg);
    this.update();
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.widget.update();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.widget.activate();
  }
}
