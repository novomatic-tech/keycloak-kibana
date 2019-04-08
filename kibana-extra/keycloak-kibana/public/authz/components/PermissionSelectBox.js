import React from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover
} from '@elastic/eui';

export default class PermissionSelectBox extends React.Component { // TODO: make it pretty!

  constructor(props) {
    super(props);
    this.state = {
      popoverOpen: false
    };
  }

  togglePopover = () => {
    this.setState(prevState => ({ popoverOpen: !prevState.popoverOpen }));
  };

  closePopover = () => {
    this.setState({ popoverOpen: false });
  };

  onPopoverBlur = () => {
    // you must be asking... WTF? I know... but this timeout is
    // required to make sure we process the onBlur events after the initial
    // event cycle. Reference:
    // https://medium.com/@jessebeach/dealing-with-focus-and-blur-in-a-composite-widget-in-react-90d3c3b49a9b
    window.requestAnimationFrame(() => {
      if (!this.popoverDiv.contains(document.activeElement) && this.props.onBlur) {
        this.props.onBlur();
      }
    });
  };

  registerPopoverDiv = (popoverDiv) => {
    if (!this.popoverDiv) {
      this.popoverDiv = popoverDiv;
      this.popoverDiv.addEventListener('focusout', this.onPopoverBlur);
    }
  };

  componentWillUnmount() {
    if (this.popoverDiv) {
      this.popoverDiv.removeEventListener('focusout', this.onPopoverBlur);
    }
  }

  onItemSelected = (item) => {
    this.closePopover();
    this.props.onChange(item);
  };

  render() {
    const { onFocus } = this.props;
    const isOpen = this.state.popoverOpen;
    const popoverButton = (
      <EuiButtonIcon
        style={{ width: '2.9em', height: '2.9em', marginLeft: '1em', borderColor: 'rgba(45, 45, 45, 0.2)' }}
        size={'l'}
        aria-label="actions"
        iconType={this.props.selectedOption.icon}
        color="text"
        onClick={this.togglePopover.bind(this)}
        onFocus={onFocus}
      />
    );

    const controls = this.props.options.map(item =>
      (
        <EuiContextMenuItem
          style={{ padding: '6px 12px' }}
          onClick={() => this.onItemSelected(item)}
          key={item.value}
          icon={item.value === this.props.selectedOption.value ? 'check' : 'empty'}
        >
          {item.label}
        </EuiContextMenuItem>
      )
    );

    return (
      <EuiPopover
        popoverRef={this.registerPopoverDiv}
        id={`permission-types`}
        isOpen={isOpen}
        button={popoverButton}
        closePopover={this.closePopover}
        panelPaddingSize="none"
        anchorPosition="rightCenter"
      >
        <EuiContextMenuPanel items={controls}/>
      </EuiPopover>
    );
  }
}