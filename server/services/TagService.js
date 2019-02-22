import _ from 'lodash';

const MultiValueTagStrategy = {
    addTag: (tags, item) => {
        if (!tags.includes(item)) {
            tags.push(item);
        }
    },
    removeTag: (tags, item) => {
        const idx = tags.indexOf(item);
        if (idx !== -1) {
            tags.splice(idx, 1);
        }
    }
};

const SingleValueTagStrategy = {
    addTag: (tags, item) => {
        tags.splice(0, tags.length);
        tags.push(item);
    },
    removeTag: (tags, item) => {
        tags.splice(0, tags.length);
    }
};


export default class TagService {

    constructor(userProvider) {
        this._userProvider = userProvider;
    }

    getAllDashboardTags = async (userId, tagName) => {
        const user = await this._userProvider.getUserById(userId);
        const attributeKey = `kibana.dashboards.${tagName}`;
        if (!user.attributes) {
            return [];
        }
        return user.attributes[attributeKey] || [];
    };

    addDashboardTag = (userId, dashboardId, tagName) => {
        return this._modifyUserAttributes(userId, tagName, (tags, updateStrategy) => {
            updateStrategy.addTag(tags, dashboardId);
        });
    };

    removeDashboardTag = (userId, dashboardId, tagName) => {
        return this._modifyUserAttributes(userId, tagName, (tags, updateStrategy) => {
            updateStrategy.removeTag(tags, dashboardId);
        });
    };

    _getUpdateStrategyFor = (tagName) => {
        if (tagName === 'favourite') {
            return MultiValueTagStrategy;
        } else {
            return SingleValueTagStrategy;
        }
    };

    _modifyUserAttributes = async (userId, tagName, modifier) => {
        const user = await this._userProvider.getUserById(userId);
        const originalAttributes = user.attributes || {};
        const updateStrategy = this._getUpdateStrategyFor(tagName);
        const attributeKey = `kibana.dashboards.${tagName}`;
        const tags = originalAttributes[attributeKey] || [];
        const modifiedTags = modifier(tags, updateStrategy);
        const modifiedAttributes = Object.assign({}, originalAttributes, {
            [attributeKey]: modifiedTags
        });
        await this._userProvider.updateUser({
            id: userId,
            attributes: modifiedAttributes
        });
    };
}
