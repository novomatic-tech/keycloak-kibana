/**
 * This replaces any React component wrapped in an angular directive.
 * React components are included in Angular with the usage of an ngReact library.
 *
 * @param reactComponent - a React component class
 * @param propsFactory - a function which takes as parameters angular services
 *                       (resolvable by param names via Angular injector)
 *                       and produces a props object ready to be injected
 *                       into React component.
 *
 * @see https://github.com/elastic/kibana/blob/v6.4.2/src/core_plugins/kibana/public/dashboard/index.js#L44
 * @see https://github.com/ngReact/ngReact#the-reactdirective-service
 */
const OverriddenReactDirective = (reactComponent, propsFactory, watchedProperties = undefined, config = {}) => {
  return function ($delegate, reactDirective, $injector) {
    const props = propsFactory
      ? $injector.invoke(propsFactory)
      : undefined;

    return $delegate.map(d => {
      const directive = reactDirective(reactComponent, watchedProperties, config, props);
      directive.compile = () => directive.link;
      return Object.assign(d, directive);
    });
  };
};
export default OverriddenReactDirective;