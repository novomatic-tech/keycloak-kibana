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
    if (tags.length === 1 && tags[0] === item) {
      tags.splice(0, tags.length);
    }
  }
};

export default class TagService {

  constructor(userProvider, keyPrefix = 'kibana.dashboards') {
    this._userProvider = userProvider;
    this._keyPrefix = keyPrefix;
  }

    getAllDashboardTags = async (userId) => {
      const user = await this._userProvider.getUserById(userId);
      const prefix = `${this._keyPrefix}.`;
      const dashboardMap = new Map();
      _.keys(user.attributes)
        .filter(key => key.startsWith(prefix))
        .map(key => key.substring(prefix.length))
        .forEach(tag => {
          const dashboardIds = user.attributes[`${prefix}${tag}`] || [];
          dashboardIds.forEach(id => {
            let tags = dashboardMap.get(id);
            if (!tags) {
              tags = [];
              dashboardMap.set(id, tags);
            }
            tags.push(tag);
          });
        });
      return dashboardMap;
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
      const attributeKey = `${this._keyPrefix}.${tagName}`;
      const tags = originalAttributes[attributeKey] || [];
      modifier(tags, updateStrategy);
      const modifiedAttributes = ({ ...originalAttributes, ...{
        [attributeKey]: tags
      } });

        // TODO: This can make users go out-of-sync (because there is no concurrency control).
      await this._userProvider.updateUser({
        id: userId,
        attributes: modifiedAttributes
      });
    };
}
