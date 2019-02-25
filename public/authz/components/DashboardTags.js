import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import HeartSolidIcon from '../../images/heart-solid.svg';
import HeartRegularIcon from '../../images/heart-regular.svg';
import HomeIcon from '../../images/home-solid.svg';
import {EuiPopover} from '@elastic/eui';

const Icon = ({ src, size, alt, onClick, style }) => (
    <img onClick={onClick} src={src} style={{ cursor: 'pointer', margin: '0 2px', opacity: '0.7' }} height={size} width={size} alt={alt}/>
);

export default class DashboardTags extends React.Component { // TODO: make it pretty!

    constructor(props) {
        super(props);
    }

    render() {
        const {dashboard} = this.props;
        const tags = (dashboard.tags || []);
        const isFavourite = tags.includes('favourite');
        const isHome = tags.includes('home');
        const icons = [];
        if (isHome) {
            icons.push((
                <Icon src={HomeIcon}
                      size={16}
                      alt="This is the home dashboard" />
            ))
        }
        icons.push((
            <Icon onClick={() => this.props.toggleDashboardTag(dashboard.id, 'favourite', !isFavourite)}
                  src={isFavourite ? HeartSolidIcon : HeartRegularIcon}
                  size={16}
                  alt="Toggle favourites" />));
        return icons;
    }
}

DashboardTags.propTypes = {
    dashboard: PropTypes.object.isRequired,
    toggleDashboardTag: PropTypes.func.isRequired,
};
