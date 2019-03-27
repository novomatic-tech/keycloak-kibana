import React from 'react';
import PropTypes from 'prop-types';
import HeartSolidIcon from '../../images/heart-solid.svg';
import HeartRegularIcon from '../../images/heart-regular.svg';
import { EuiIcon } from '@elastic/eui';

const Icon = ({ src, size, alt, onClick }) => (
  <img onClick={onClick} src={src} style={{ cursor: 'pointer', margin: '0 2px', opacity: '0.7' }} height={size} width={size} alt={alt}/>
);

export default class DashboardTags extends React.Component { // TODO: make it pretty!

  constructor(props) {
    super(props);
  }

  render() {
    const { dashboard } = this.props;
    const tags = (dashboard.tags || []);
    const isFavourite = tags.includes('favourite');
    const isHome = tags.includes('home');
    const icons = [];

    const homeIcon = (
      <EuiIcon type="pin"/>
    );
    const favouriteIcon = (
      <Icon
        onClick={() => this.props.toggleDashboardTag(dashboard.id, 'favourite', !isFavourite)}
        src={isFavourite ? HeartSolidIcon : HeartRegularIcon}
        size={16}
        alt="Toggle favourites"
      />
    );

    if (isHome) {
      icons.push(homeIcon);
    }
    icons.push(favouriteIcon);
    return icons;
  }
}

DashboardTags.propTypes = {
  dashboard: PropTypes.object.isRequired,
  toggleDashboardTag: PropTypes.func.isRequired,
};
