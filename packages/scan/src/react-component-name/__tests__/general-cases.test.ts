import { describe, it, expect } from 'vitest';
import { transform } from './utils';

describe('edge cases', () => {
  it('handles nested component declarations', async () => {
    const input = `
      const Parent = () => {
        const NestedChild = () => <div>Child</div>
        return (
          <div>
            <NestedChild />
          </div>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain("Parent.displayName = 'Parent'");
    expect(result).toContain("NestedChild.displayName = 'NestedChild'");
  });

  it('handles components with complex expressions', async () => {
    const input = `
      const DynamicComponent = () => {
        const content = useMemo(() => (
          <div>
            {data.map(item => (
              <Fragment key={item.id}>
                {item.visible && <span>{item.text}</span>}
              </Fragment>
            ))}
          </div>
        ), [data])

        return (
          <>
            {isLoading ? <Spinner /> : content}
          </>
        )
      }
    `;
    const result = await transform(input);
    expect(result).toContain(
      "DynamicComponent.displayName = 'DynamicComponent'",
    );
  });

  it('handles components with multiple returns in switch/case', async () => {
    const input = `
      const StatusComponent = ({ status }) => {
        switch (status) {
          case 'loading':
            return <Spinner />
          case 'error':
            return <Error />
          case 'empty':
            return <Empty />
          default:
            return <Content />
        }
      }
    `;
    const result = await transform(input);
    expect(result).toContain("StatusComponent.displayName = 'StatusComponent'");
  });

  it('handles components with try/catch blocks', async () => {
    const input = `
      const SafeComponent = () => {
        try {
          const data = riskyOperation()
          return <div>{data}</div>
        } catch (error) {
          return <div>Error: {error.message}</div>
        }
      }
    `;
    const result = await transform(input);
    expect(result).toContain("SafeComponent.displayName = 'SafeComponent'");
  });

  it('handles components returning primitive values', async () => {
    const input = `
      // Null component
      const EmptyComponent = () => null;

      // String component
      const TextComponent = () => "Hello World";

      // Number component
      const NumberComponent = () => 42;

      // Boolean component (though not very useful)
      const BooleanComponent = () => true;

      // Array of elements
      const ListComponent = () => [
        <div key="1">One</div>,
        <div key="2">Two</div>
      ];

      // Conditional primitive returns
      const ConditionalComponent = ({ value }) => {
        if (!value) return null;
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return value.toString();
        return <div>{value}</div>;
      };

      // Dynamic children
      const DynamicComponent = ({ count }) => {
        return Array(count).fill(null).map((_, i) => <div key={i} />);
      };

      // Async component with suspense
      const AsyncComponent = () => {
        const resource = fetchData();
        if (!resource.isReady) {
          throw resource.promise;
        }
        return <div>{resource.read()}</div>;
      };

      // Portal component
      const PortalComponent = () => {
        return createPortal(<div>Portal content</div>, document.body);
      };

      // Fragment shorthand
      const FragmentComponent = () => <>Fragment content</>;

      // Nested arrays and fragments
      const NestedComponent = () => [
        <div key="1">First</div>,
        <>
          <div>Nested 1</div>
          <div>Nested 2</div>
        </>,
        [<div key="3">Deep nested</div>]
      ];
    `;
    const result = await transform(input);
    expect(result).toContain("EmptyComponent.displayName = 'EmptyComponent'");
    expect(result).toContain("TextComponent.displayName = 'TextComponent'");
    expect(result).toContain("NumberComponent.displayName = 'NumberComponent'");
    expect(result).toContain("BooleanComponent.displayName = 'BooleanComponent'");
    expect(result).toContain("ListComponent.displayName = 'ListComponent'");
    expect(result).toContain(
      "ConditionalComponent.displayName = 'ConditionalComponent'",
    );
    expect(result).toContain("DynamicComponent.displayName = 'DynamicComponent'");
    expect(result).toContain("AsyncComponent.displayName = 'AsyncComponent'");
    expect(result).toContain("PortalComponent.displayName = 'PortalComponent'");
    expect(result).toContain(
      "FragmentComponent.displayName = 'FragmentComponent'",
    );
    expect(result).toContain("NestedComponent.displayName = 'NestedComponent'");
  });

  it('handles components with complex conditional returns', async () => {
    const input = `
      const ComplexComponent = ({ type, data }) => {
        switch (type) {
          case 'text': return data;
          case 'number': return data.toString();
          case 'array': return data.map(item => <div key={item.id}>{item.text}</div>);
          case 'element': return <div>{data}</div>;
          default: return null;
        }
      };

      const TernaryComponent = ({ condition, value }) =>
        condition
          ? value
          : value
            ? <span>{value}</span>
            : null;

      const ShortCircuitComponent = ({ items }) =>
        items?.length && items.map(item => <div key={item}>{item}</div>);

      const NullishComponent = ({ text }) =>
        text ?? "Default text";

      const ChainedComponent = ({ a, b, c }) =>
        a?.b?.c ?? <div>Fallback</div>;

      // More Suspense examples
      const DataComponent = () => {
        const data = resource.read();
        return <div>{data}</div>;
      };

      const SuspenseImage = ({ src }) => {
        const resource = preloadImage(src);
        if (!resource.complete) {
          throw resource.promise;
        }
        return <img src={src} alt="" />;
      };

      const ProfileComponent = () => {
        const user = userResource.read();
        const posts = postsResource.read();
        if (!user || !posts) {
          throw Promise.all([user?.promise, posts?.promise]);
        }
        return (
          <div>
            <h1>{user.name}</h1>
            {posts.map(post => <div key={post.id}>{post.title}</div>)}
          </div>
        );
      };
    `;
    const result = await transform(input);
    expect(result).toContain("ComplexComponent.displayName = 'ComplexComponent'");
    expect(result).toContain("TernaryComponent.displayName = 'TernaryComponent'");
    expect(result).toContain(
      "ShortCircuitComponent.displayName = 'ShortCircuitComponent'",
    );
    expect(result).toContain("NullishComponent.displayName = 'NullishComponent'");
    expect(result).toContain("ChainedComponent.displayName = 'ChainedComponent'");
    expect(result).toContain("DataComponent.displayName = 'DataComponent'");
    expect(result).toContain("SuspenseImage.displayName = 'SuspenseImage'");
    expect(result).toContain("ProfileComponent.displayName = 'ProfileComponent'");
  });

  it('handles components with complex state and hooks', async () => {
    const input = `
      export const ValueUpdate = ({
        valueUpdate,
        className,
      }) => {
        const actions = useTraceStoreActions();
        const referredToHeapObject = useTraceStore(getReferredToHeapObjectSelector(valueUpdate));
        const constructorStackFrame = useTraceStore(
          referredToHeapObject ? constructorStackFrameSelector(referredToHeapObject.constructorStackFrameId) : () => null,
        );

        const referredToHeapObjectColor = constructorStackFrame ? getFrameColor(constructorStackFrame) : undefined;

        return (
          <AnimatedTrace
            animation={"grow"}
            style={{
              borderColor: referredToHeapObjectColor,
            }}
            key={valueUpdate.valueUpdateId}
            className={cn([
              referredToHeapObject && "border-4",
              referredToHeapObject && "m-[2px]",
            ])}
          >
            <div className="w-fit flex items-center">
              <Editable
                styles={{
                  notEditing: {
                    maxWidth: "20em",
                    minHeight: "0px",
                    height: "1.2rem",
                  },
                }}
                classNames={{
                  notEditing: {
                    input: className,
                  },
                }}
                focusedId={valueUpdate.valueUpdateId}
                key={valueUpdate.valueUpdateId}
                state={{
                  value: valueUpdate.value,
                  onTrash: () => {
                    actions.shared.deleteValueUpdate(valueUpdate.valueUpdateId);
                  },
                  onValueChange: (newValue) => {
                    actions.shared.changeVariableUpdateValue({
                      value: newValue,
                      valueUpdateId: valueUpdate.valueUpdateId,
                    });
                  },
                }}
              />
            </div>
          </AnimatedTrace>
        );
      };

      // Another example with complex state management
      const DataGrid = ({ data, onSort }) => {
        const [sortField, setSortField] = useState(null);
        const [sortDirection, setSortDirection] = useState('asc');
        const [filters, setFilters] = useState({});

        const sortedData = useMemo(() => {
          if (!sortField) return data;
          return [...data].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
          });
        }, [data, sortField, sortDirection]);

        const filteredData = useMemo(() => {
          return sortedData.filter(item => {
            return Object.entries(filters).every(([key, value]) => {
              return item[key].toString().toLowerCase().includes(value.toLowerCase());
            });
          });
        }, [sortedData, filters]);

        const handleHeaderClick = (field) => {
          if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
          onSort?.({ field, direction: sortDirection });
        };

        return (
          <div className="data-grid">
            <div className="header">
              {Object.keys(data[0] || {}).map(field => (
                <div
                  key={field}
                  onClick={() => handleHeaderClick(field)}
                  className={cn([
                    'header-cell',
                    sortField === field && 'sorted',
                    sortField === field && sortDirection === 'desc' && 'desc'
                  ])}
                >
                  {field}
                </div>
              ))}
            </div>
            <div className="body">
              {filteredData.map((row, i) => (
                <div key={i} className="row">
                  {Object.values(row).map((cell, j) => (
                    <div key={j} className="cell">{cell}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );
      };
    `;
    const result = await transform(input);
    expect(result).toContain("ValueUpdate.displayName = 'ValueUpdate'");
    expect(result).toContain("DataGrid.displayName = 'DataGrid'");
  });

  it('handles all forwardRef patterns', async () => {
    const input = `
      // Basic forwardRef
      const Button = React.forwardRef((props, ref) => (
        <button ref={ref} {...props} />
      ));

      // Named function in forwardRef
      const Input = React.forwardRef(function Input(props, ref) {
        return <input ref={ref} {...props} />;
      });

      // forwardRef with type annotations
      const Select = React.forwardRef<HTMLSelectElement, SelectProps>((props, ref) => (
        <select ref={ref} {...props} />
      ));

      // forwardRef with displayName already set (should preserve it)
      const TextArea = React.forwardRef((props, ref) => {
        return <textarea ref={ref} {...props} />;
      });
      TextArea.displayName = 'CustomTextArea';

      // Complex forwardRef with hooks and logic
      const Field = React.forwardRef((props, ref) => {
        const [value, setValue] = useState('');
        const internalRef = useRef(null);

        useImperativeHandle(ref, () => ({
          focus: () => internalRef.current?.focus(),
          reset: () => setValue('')
        }));

        return (
          <div>
            <input
              ref={internalRef}
              value={value}
              onChange={e => setValue(e.target.value)}
            />
          </div>
        );
      });

      // forwardRef with memo
      const MemoizedInput = React.memo(React.forwardRef((props, ref) => (
        <input ref={ref} {...props} />
      )));

      // forwardRef wrapped in HOC
      const EnhancedInput = withStyles(React.forwardRef((props, ref) => (
        <input ref={ref} {...props} />
      )));
    `;
    const result = await transform(input);
    expect(result).toContain("Button.displayName = 'Button'");
    expect(result).toContain("Input.displayName = 'Input'");
    expect(result).toContain("Select.displayName = 'Select'");
    expect(result).toContain("TextArea.displayName = 'CustomTextArea'"); // Should preserve existing, todo check for one

    expect(result).toContain("Field.displayName = 'Field'");
    expect(result).toContain("MemoizedInput.displayName = 'MemoizedInput'");
    expect(result).toContain("EnhancedInput.displayName = 'EnhancedInput'");
  });

  it('handles all memo patterns', async () => {
    const input = `
      // Basic memo
      const Item = React.memo(props => (
        <div>{props.text}</div>
      ));

      // Named function in memo
      const Header = React.memo(function Header({ title }) {
        return <h1>{title}</h1>;
      });

      // memo with comparison function
      const ExpensiveList = React.memo(({ items }) => (
        <ul>
          {items.map(item => <li key={item.id}>{item.text}</li>)}
        </ul>
      ), (prevProps, nextProps) => prevProps.items === nextProps.items);


      // memo with type annotations
      const TypedButton = React.memo<ButtonProps>(props => (
        <button {...props} />
      ));

      // memo with displayName already set (should preserve it)
      const Footer = React.memo(props => (
        <footer>{props.children}</footer>
      ));
      Footer.displayName = 'CustomFooter';

      // Complex memo with hooks and logic
      const SearchBar = React.memo(({ onSearch }) => {
        const [query, setQuery] = useState('');
        const debouncedQuery = useDebounce(query, 300);

        useEffect(() => {
          onSearch(debouncedQuery);
        }, [debouncedQuery, onSearch]);

        return (
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        );
      });

      // Nested memo
      const NestedMemo = React.memo(React.memo(props => (
        <div>{props.text}</div>
      )));

      // memo wrapped in HOC
      const EnhancedList = withStyles(React.memo(props => (
        <ul>{props.items.map(item => <li key={item.id}>{item.text}</li>)}</ul>
      )));

      // memo with forwardRef
      const MemoInput = React.memo(React.forwardRef((props, ref) => (
        <input ref={ref} {...props} />
      )));
    `;

    const result = await transform(input);
    expect(result).toContain("Item.displayName = 'Item'");
    expect(result).toContain("Header.displayName = 'Header'");
    expect(result).toContain("ExpensiveList.displayName = 'ExpensiveList'");
    expect(result).toContain("TypedButton.displayName = 'TypedButton'");
    expect(result).toContain("Footer.displayName = 'CustomFooter'"); // Should preserve existing
    expect(result).toContain("SearchBar.displayName = 'SearchBar'");
    expect(result).toContain("NestedMemo.displayName = 'NestedMemo'");
    expect(result).toContain("EnhancedList.displayName = 'EnhancedList'");
    expect(result).toContain("MemoInput.displayName = 'MemoInput'");
  });

  it('handles components with various function calls returning JSX', async () => {
    const input = `
      const ArrayMethodsComponent = ({ items }) => {
        // Filter then map
        const filtered = items
          .filter(item => item.visible)
          .map(item => <div key={item.id}>{item.text}</div>);

        // Reduce to JSX
        const reduced = items.reduce((acc, item) => [
          ...acc,
          <div key={item.id}>{item.text}</div>
        ], []);

        // Custom function returning JSX
        const renderItem = (item) => <div>{item.text}</div>;

        // Method chaining with JSX returns
        const processed = items
          .slice(0, 5)
          .filter(item => item.score > 10)
          .map(renderItem);

        return (
          <>
            <div>{filtered}</div>
            <div>{reduced}</div>
            <div>{processed}</div>
            <div>{renderItem(items[0])}</div>
          </>
        );
      };

      // Custom utility functions returning JSX
      const renderList = (items) => items.map(item => <li key={item.id}>{item.text}</li>);
      const createWrapper = (content) => <div className="wrapper">{content}</div>;
      const withLayout = (Component) => (props) => (
        <div className="layout">
          <Component {...props} />
        </div>
      );

      const CustomFunctionsComponent = ({ items }) => {
        // Direct function calls returning JSX
        const list = renderList(items);
        const wrapped = createWrapper(<span>Content</span>);

        // Function composition
        const content = createWrapper(renderList(items));

        // HOC usage
        const WrappedComponent = withLayout(({ text }) => <div>{text}</div>);

        return (
          <>
            {list}
            {wrapped}
            {content}
            <WrappedComponent text="Hello" />
          </>
        );
      };

      // Promise/async function returns
      const AsyncComponent = ({ id }) => {
        const [data, setData] = useState(null);

        useEffect(() => {
          const fetchData = async () => {
            const result = await api.get(id);
            return <div>{result.data}</div>;
          };

          fetchData().then(setData);
        }, [id]);

        return data || <div>Loading...</div>;
      };

      // Complex method chaining
      const ChainedComponent = ({ data }) => {
        const result = Object.entries(data)
          .filter(([_, value]) => value.isValid)
          .map(([key, value]) => ({ key, ...value }))
          .reduce((acc, item) => ({
            ...acc,
            [item.key]: <div key={item.key}>{item.content}</div>
          }), {});

        return (
          <div>
            {Object.values(result)}
          </div>
        );
      };

      // Functional composition
      const compose = (...fns) => x => fns.reduceRight((v, f) => f(v), x);

      const withData = Component => props => {
        const data = useData();
        return <Component {...props} data={data} />;
      };

      const withTheme = Component => props => {
        const theme = useTheme();
        return <Component {...props} theme={theme} />;
      };

      const BaseComponent = ({ data, theme, label }) => (
        <div className={theme}>{data[label]}</div>
      );

      const EnhancedComponent = compose(
        withData,
        withTheme
      )(BaseComponent);
    `;

    const result = await transform(input);
    expect(result).toContain(
      "ArrayMethodsComponent.displayName = 'ArrayMethodsComponent'",
    );
    expect(result).toContain(
      "CustomFunctionsComponent.displayName = 'CustomFunctionsComponent'",
    );
    expect(result).toContain("AsyncComponent.displayName = 'AsyncComponent'");
    expect(result).toContain("ChainedComponent.displayName = 'ChainedComponent'");
    expect(result).toContain("BaseComponent.displayName = 'BaseComponent'");
    expect(result).toContain(
      "EnhancedComponent.displayName = 'EnhancedComponent'",
    );
  });

  it('handles shadcn-style component patterns', async () => {
    const input = `
      // Basic shadcn component pattern
      const Button = React.forwardRef<
        HTMLButtonElement,
        React.ButtonHTMLAttributes<HTMLButtonElement>
      >(({ className, ...props }, ref) => (
        <button
          className={cn("rounded-lg px-4", className)}
          ref={ref}
          {...props}
        />
      ));

      // With variants using cva
      const button = cva(
        "rounded-lg px-4",
        {
          variants: {
            variant: {
              default: "bg-primary",
              secondary: "bg-secondary",
            },
            size: {
              default: "h-10",
              sm: "h-8",
              lg: "h-12",
            },
          },
          defaultVariants: {
            variant: "default",
            size: "default",
          },
        }
      );

      interface ButtonProps
        extends React.ButtonHTMLAttributes<HTMLButtonElement>,
          VariantProps<typeof button> {}

      const ButtonWithVariants = React.forwardRef<HTMLButtonElement, ButtonProps>(
        ({ className, variant, size, ...props }, ref) => {
          return (
            <button
              className={cn(button({ variant, size, className }))}
              ref={ref}
              {...props}
            />
          )
        }
      );

      // With slot compositions
      const Card = React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >(({ className, ...props }, ref) => (
        <div
          ref={ref}
          className={cn("rounded-lg border", className)}
          {...props}
        />
      ));

      const CardHeader = React.forwardRef<
        HTMLDivElement,
        React.HTMLAttributes<HTMLDivElement>
      >(({ className, ...props }, ref) => (
        <div
          ref={ref}
          className={cn("flex flex-col space-y-1.5 p-6", className)}
          {...props}
        />
      ));

      // Component composition
      const Dialog = ({ children, ...props }) => (
        <DialogPrimitive.Root {...props}>
          {children}
        </DialogPrimitive.Root>
      );

      const DialogTrigger = React.forwardRef<
        React.ElementRef<typeof DialogPrimitive.Trigger>,
        React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
      >(({ className, ...props }, ref) => (
        <DialogPrimitive.Trigger
          ref={ref}
          className={cn("", className)}
          {...props}
        />
      ));
    `;

    const result = await transform(input);
    expect(result).toContain("Button.displayName = 'Button'");
    expect(result).toContain(
      "ButtonWithVariants.displayName = 'ButtonWithVariants'",
    );
    expect(result).toContain("Card.displayName = 'Card'");
    expect(result).toContain("CardHeader.displayName = 'CardHeader'");
    expect(result).toContain("Dialog.displayName = 'Dialog'");
    expect(result).toContain("DialogTrigger.displayName = 'DialogTrigger'");
  });

  it('handles legacy and unconventional component patterns', async () => {
    const input = `


      // createReactClass (after createClass was removed from React)
      const CreateClassComponent = createReactClass({
        render() {
          return <div>Still Legacy</div>
        }
      });

      // Mixins (old pattern, but still exists)
      const mixins = {
        componentDidMount() {
          console.log('mounted');
        }
      };

      const WithMixins = createReactClass({
        mixins: [mixins],
        render() {
          return <div>With Mixins</div>
        }
      });

      // Factory pattern (common in older Material-UI and other libs)
      const createComponent = (config) => {
        class GeneratedComponent extends React.Component {
          render() {
            return <div>{config.text}</div>
          }
        }
        return GeneratedComponent;
      };
      const FactoryComponent = createComponent({ text: 'Factory' });

      // Decorator pattern (still common in MobX codebases)
      @observer
      class DecoratedComponent extends React.Component {
        render() {
          return <div>{this.props.data}</div>
        }
      }

      // Render props with multiple children functions
      const RenderPropComponent = ({ children, render, component: Component }) => (
        <div>
          {children(data)}
          {render(data)}
          <Component data={data} />
        </div>
      );

      // Old context pattern
      class OldContextComponent extends React.Component {
        static contextTypes = {
          theme: PropTypes.object
        };

        render() {
          return <div>{this.context.theme}</div>
        }
      }

      // Partial application component creation
      const createPartialComponent = (defaultProps) =>
        function PartialComponent(props) {
          return <div {...defaultProps} {...props} />;
        };
      const PartialButton = createPartialComponent({ type: 'button' });

      // jQuery-style plugins (seen in older React codebases)
      React.Component.prototype.plugin = function() {
        return <div>Plugin</div>;
      };
      class PluginComponent extends React.Component {
        render() {
          return this.plugin();
        }
      }



      // Multiple inheritance simulation
      const withInheritance = Base => class extends Base {
        render() {
          return <div>Extended {super.render()}</div>;
        }
      };
      class BaseComponent extends React.Component {
        render() {
          return <div>Base</div>;
        }
      }
      const InheritedComponent = withInheritance(BaseComponent);
    `;

    const result = await transform(input);
    expect(result).toContain(
      "CreateClassComponent.displayName = 'CreateClassComponent'",
    );
    expect(result).toContain("WithMixins.displayName = 'WithMixins'");
    expect(result).toContain("FactoryComponent.displayName = 'FactoryComponent'");
    expect(result).toContain(
      "DecoratedComponent.displayName = 'DecoratedComponent'",
    );
    expect(result).toContain(
      "RenderPropComponent.displayName = 'RenderPropComponent'",
    );
    expect(result).toContain(
      "OldContextComponent.displayName = 'OldContextComponent'",
    );
    expect(result).toContain("PartialButton.displayName = 'PartialButton'");
    expect(result).toContain("PluginComponent.displayName = 'PluginComponent'");
    expect(result).toContain(
      "InheritedComponent.displayName = 'InheritedComponent'",
    );
  });
});
