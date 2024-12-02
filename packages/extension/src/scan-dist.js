/**
 * todo this should be cached to the latest version on unpkg
 * but we can't load the code with a script tag using unpkg or we get
 * CORS errors
 */
!(function (e) {
  'use strict';
  var t = Object.create,
    n = Object.defineProperty,
    r = Object.getOwnPropertyDescriptor,
    o = Object.getOwnPropertyNames,
    l = Object.getOwnPropertySymbols,
    i = Object.getPrototypeOf,
    u = Object.prototype.hasOwnProperty,
    a = Object.prototype.propertyIsEnumerable,
    c = (e, t, r) =>
      t in e
        ? n(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r })
        : (e[t] = r),
    s = (e, t) => {
      for (var n in t || (t = {})) u.call(t, n) && c(e, n, t[n]);
      if (l) for (var n of l(t)) a.call(t, n) && c(e, n, t[n]);
      return e;
    },
    f = (e, t) =>
      function () {
        return (
          t || (0, e[o(e)[0]])((t = { exports: {} }).exports, t), t.exports
        );
      },
    p = (e, l, a) => (
      (a = e != null ? t(i(e)) : {}),
      ((e, t, l, i) => {
        if ((t && typeof t === 'object') || typeof t === 'function')
          {for (const a of o(t))
            {u.call(e, a) ||
              a === l ||
              n(e, a, {
                get: () => t[a],
                enumerable: !(i = r(t, a)) || i.enumerable,
              });}}
        return e;
      })(
        e && e.__esModule ? a : n(a, 'default', { value: e, enumerable: !0 }),
        e,
      )
    ),
    d = (e, t, n) =>
      new Promise((r, o) => {
        var l = (e) => {
            try {
              u(n.next(e));
            } catch (e) {
              o(e);
            }
          },
          i = (e) => {
            try {
              u(n.throw(e));
            } catch (e) {
              o(e);
            }
          },
          u = (e) =>
            e.done ? r(e.value) : Promise.resolve(e.value).then(l, i);
        u((n = n.apply(e, t)).next());
      }),
    m = f({
      'node_modules/.pnpm/react@18.3.1/node_modules/react/cjs/react.production.min.js'(
        e,
      ) {
        const t = Symbol.for('react.element'),
          n = Symbol.for('react.portal'),
          r = Symbol.for('react.fragment'),
          o = Symbol.for('react.strict_mode'),
          l = Symbol.for('react.profiler'),
          i = Symbol.for('react.provider'),
          u = Symbol.for('react.context'),
          a = Symbol.for('react.forward_ref'),
          c = Symbol.for('react.suspense'),
          s = Symbol.for('react.memo'),
          f = Symbol.for('react.lazy'),
          p = Symbol.iterator;
        const d = {
            isMounted: function () {
              return !1;
            },
            enqueueForceUpdate: function () {},
            enqueueReplaceState: function () {},
            enqueueSetState: function () {},
          },
          m = Object.assign,
          y = {};
        function h(e, t, n) {
          (this.props = e),
            (this.context = t),
            (this.refs = y),
            (this.updater = n || d);
        }
        function b() {}
        function g(e, t, n) {
          (this.props = e),
            (this.context = t),
            (this.refs = y),
            (this.updater = n || d);
        }
        (h.prototype.isReactComponent = {}),
          (h.prototype.setState = function (e, t) {
            if (typeof e !== 'object' && typeof e !== 'function' && e != null)
              {throw Error(
                'setState(...): takes an object of state variables to update or a function which returns an object of state variables.',
              );}
            this.updater.enqueueSetState(this, e, t, 'setState');
          }),
          (h.prototype.forceUpdate = function (e) {
            this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
          }),
          (b.prototype = h.prototype);
        const v = (g.prototype = new b());
        (v.constructor = g), m(v, h.prototype), (v.isPureReactComponent = !0);
        const w = Array.isArray,
          _ = Object.prototype.hasOwnProperty,
          $ = { current: null },
          S = { key: !0, ref: !0, __self: !0, __source: !0 };
        function C(e, n, r) {
          let o,
            l = {},
            i = null,
            u = null;
          if (n != null)
            {for (o in (void 0 !== n.ref && (u = n.ref),
            void 0 !== n.key && (i = `${  n.key}`),
            n))
              {_.call(n, o) && !S.hasOwnProperty(o) && (l[o] = n[o]);}}
          let a = arguments.length - 2;
          if (a === 1) l.children = r;
          else if (a > 1) {
            for (var c = Array(a), s = 0; s < a; s++) c[s] = arguments[s + 2];
            l.children = c;
          }
          if (e && e.defaultProps)
            {for (o in (a = e.defaultProps)) void 0 === l[o] && (l[o] = a[o]);}
          return {
            $$typeof: t,
            type: e,
            key: i,
            ref: u,
            props: l,
            _owner: $.current,
          };
        }
        function x(e) {
          return typeof e === 'object' && e !== null && e.$$typeof === t;
        }
        const E = /\/+/g;
        function O(e, t) {
          return typeof e === 'object' && e !== null && e.key != null
            ? (function (e) {
                const t = { '=': '=0', ':': '=2' };
                return (
                  `$${ 
                  e.replace(/[=:]/g, function (e) {
                    return t[e];
                  })}`
                );
              })(`${  e.key}`)
            : t.toString(36);
        }
        function j(e, r, o, l, i) {
          let u = typeof e;
          (u !== 'undefined' && u !== 'boolean') || (e = null);
          let a = !1;
          if (e === null) a = !0;
          else
            {switch (u) {
              case 'string':
              case 'number':
                a = !0;
                break;
              case 'object':
                switch (e.$$typeof) {
                  case t:
                  case n:
                    a = !0;
                }
            }}
          if (a)
            {return (
              (i = i((a = e))),
              (e = l === '' ? `.${  O(a, 0)}` : l),
              w(i)
                ? ((o = ''),
                  e != null && (o = `${e.replace(E, '$&/')  }/`),
                  j(i, r, o, '', function (e) {
                    return e;
                  }))
                : i != null &&
                  (x(i) &&
                    (i = (function (e, n) {
                      return {
                        $$typeof: t,
                        type: e.type,
                        key: n,
                        ref: e.ref,
                        props: e.props,
                        _owner: e._owner,
                      };
                    })(
                      i,
                      o +
                        (!i.key || (a && a.key === i.key)
                          ? ''
                          : `${(`${  i.key}`).replace(E, '$&/')  }/`) +
                        e,
                    )),
                  r.push(i)),
              1
            );}
          if (((a = 0), (l = l === '' ? '.' : `${l  }:`), w(e)))
            {for (var c = 0; c < e.length; c++) {
              var s = l + O((u = e[c]), c);
              a += j(u, r, o, s, i);
            }}
          else if (
            ((s = (function (e) {
              return e === null || typeof e !== 'object'
                ? null
                : typeof (e = (p && e[p]) || e['@@iterator']) === 'function'
                  ? e
                  : null;
            })(e)),
            typeof s === 'function')
          )
            {for (e = s.call(e), c = 0; !(u = e.next()).done; )
              {a += j((u = u.value), r, o, (s = l + O(u, c++)), i);}}
          else if (u === 'object')
            {throw (
              ((r = String(e)),
              Error(
                `Objects are not valid as a React child (found: ${ 
                  r === '[object Object]'
                    ? `object with keys {${  Object.keys(e).join(', ')  }}`
                    : r 
                  }). If you meant to render a collection of children, use an array instead.`,
              ))
            );}
          return a;
        }
        function k(e, t, n) {
          if (e == null) return e;
          let r = [],
            o = 0;
          return (
            j(e, r, '', '', function (e) {
              return t.call(n, e, o++);
            }),
            r
          );
        }
        function R(e) {
          if (e._status === -1) {
            let t = e._result;
            (t = t()).then(
              function (t) {
                (e._status !== 0 && e._status !== -1) ||
                  ((e._status = 1), (e._result = t));
              },
              function (t) {
                (e._status !== 0 && e._status !== -1) ||
                  ((e._status = 2), (e._result = t));
              },
            ),
              e._status === -1 && ((e._status = 0), (e._result = t));
          }
          if (e._status === 1) return e._result.default;
          throw e._result;
        }
        const P = { current: null },
          T = { transition: null },
          L = {
            ReactCurrentDispatcher: P,
            ReactCurrentBatchConfig: T,
            ReactCurrentOwner: $,
          };
        function F() {
          throw Error(
            'act(...) is not supported in production builds of React.',
          );
        }
        (e.Children = {
          map: k,
          forEach: function (e, t, n) {
            k(
              e,
              function () {
                t.apply(this, arguments);
              },
              n,
            );
          },
          count: function (e) {
            let t = 0;
            return (
              k(e, function () {
                t++;
              }),
              t
            );
          },
          toArray: function (e) {
            return (
              k(e, function (e) {
                return e;
              }) || []
            );
          },
          only: function (e) {
            if (!x(e))
              {throw Error(
                'React.Children.only expected to receive a single React element child.',
              );}
            return e;
          },
        }),
          (e.Component = h),
          (e.Fragment = r),
          (e.Profiler = l),
          (e.PureComponent = g),
          (e.StrictMode = o),
          (e.Suspense = c),
          (e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = L),
          (e.act = F),
          (e.cloneElement = function (e, n, r) {
            if (e == null)
              {throw Error(
                `React.cloneElement(...): The argument must be a React element, but you passed ${ 
                  e 
                  }.`,
              );}
            let o = { ...e.props},
              l = e.key,
              i = e.ref,
              u = e._owner;
            if (n != null) {
              if (
                (void 0 !== n.ref && ((i = n.ref), (u = $.current)),
                void 0 !== n.key && (l = `${  n.key}`),
                e.type && e.type.defaultProps)
              )
                {var a = e.type.defaultProps;}
              for (c in n)
                {_.call(n, c) &&
                  !S.hasOwnProperty(c) &&
                  (o[c] = void 0 === n[c] && void 0 !== a ? a[c] : n[c]);}
            }
            var c = arguments.length - 2;
            if (c === 1) o.children = r;
            else if (c > 1) {
              a = Array(c);
              for (let s = 0; s < c; s++) a[s] = arguments[s + 2];
              o.children = a;
            }
            return {
              $$typeof: t,
              type: e.type,
              key: l,
              ref: i,
              props: o,
              _owner: u,
            };
          }),
          (e.createContext = function (e) {
            return (
              ((e = {
                $$typeof: u,
                _currentValue: e,
                _currentValue2: e,
                _threadCount: 0,
                Provider: null,
                Consumer: null,
                _defaultValue: null,
                _globalName: null,
              }).Provider = { $$typeof: i, _context: e }),
              (e.Consumer = e)
            );
          }),
          (e.createElement = C),
          (e.createFactory = function (e) {
            const t = C.bind(null, e);
            return (t.type = e), t;
          }),
          (e.createRef = function () {
            return { current: null };
          }),
          (e.forwardRef = function (e) {
            return { $$typeof: a, render: e };
          }),
          (e.isValidElement = x),
          (e.lazy = function (e) {
            return {
              $$typeof: f,
              _payload: { _status: -1, _result: e },
              _init: R,
            };
          }),
          (e.memo = function (e, t) {
            return { $$typeof: s, type: e, compare: void 0 === t ? null : t };
          }),
          (e.startTransition = function (e) {
            const t = T.transition;
            T.transition = {};
            try {
              e();
            } finally {
              T.transition = t;
            }
          }),
          (e.unstable_act = F),
          (e.useCallback = function (e, t) {
            return P.current.useCallback(e, t);
          }),
          (e.useContext = function (e) {
            return P.current.useContext(e);
          }),
          (e.useDebugValue = function () {}),
          (e.useDeferredValue = function (e) {
            return P.current.useDeferredValue(e);
          }),
          (e.useEffect = function (e, t) {
            return P.current.useEffect(e, t);
          }),
          (e.useId = function () {
            return P.current.useId();
          }),
          (e.useImperativeHandle = function (e, t, n) {
            return P.current.useImperativeHandle(e, t, n);
          }),
          (e.useInsertionEffect = function (e, t) {
            return P.current.useInsertionEffect(e, t);
          }),
          (e.useLayoutEffect = function (e, t) {
            return P.current.useLayoutEffect(e, t);
          }),
          (e.useMemo = function (e, t) {
            return P.current.useMemo(e, t);
          }),
          (e.useReducer = function (e, t, n) {
            return P.current.useReducer(e, t, n);
          }),
          (e.useRef = function (e) {
            return P.current.useRef(e);
          }),
          (e.useState = function (e) {
            return P.current.useState(e);
          }),
          (e.useSyncExternalStore = function (e, t, n) {
            return P.current.useSyncExternalStore(e, t, n);
          }),
          (e.useTransition = function () {
            return P.current.useTransition();
          }),
          (e.version = '18.3.1');
      },
    }),
    y = f({
      'node_modules/.pnpm/react@18.3.1/node_modules/react/index.js'(e, t) {
        t.exports = m();
      },
    }),
    h = p(y()),
    b = p(y()),
    g = (e) => {
      let t;
      switch (typeof e) {
        case 'function':
          return e.toString();
        case 'string':
          return e;
        case 'object':
          if (e === null) return 'null';
          if (Array.isArray(e)) return e.length > 0 ? '[…]' : '[]';
          if (
            b.isValidElement(e) &&
            '$$typeof' in e &&
            typeof e.$$typeof === 'symbol' &&
            String(e.$$typeof) === 'Symbol(react.element)'
          )
            {return `<${(t = S(e.type)) != null ? t : ''}${Object.keys(e.props || {}).length > 0 ? ' …' : ''}>`;}
          if (typeof e === 'object' && e !== null && e.constructor === Object) {
            for (const t in e)
              {if (Object.prototype.hasOwnProperty.call(e, t)) return '{…}';}
            return '{}';
          }
          const n = Object.prototype.toString.call(e).slice(8, -1);
          if (n === 'Object') {
            const t = Object.getPrototypeOf(e),
              n = t == null ? void 0 : t.constructor;
            if (typeof n === 'function')
              {return `${n.displayName || n.name || ''}{…}`;}
          }
          return `${n}{…}`;
        default:
          return String(e);
      }
    },
    v = b.createElement('div'),
    w = () => {},
    _ = (e, t, n = !1) => {
      if (!e) return null;
      if (!0 === t(e)) return e;
      let r = n ? e.return : e.child;
      for (; r; ) {
        const e = _(r, t, n);
        if (e) return e;
        r = n ? null : r.sibling;
      }
      return null;
    },
    $ = (e) =>
      typeof e === 'function'
        ? e
        : typeof e === 'object' && e
          ? $(e.type || e.render)
          : null,
    S = (e) => ((e = $(e)) && (e.displayName || e.name)) || null,
    C = ({ onCommitFiberRoot: e }) => {
      let t = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      const n = new Map();
      let r = 0;
      t ||
        ((t = {
          checkDCE: w,
          supportsFiber: !0,
          renderers: n,
          onScheduleFiberRoot: w,
          onCommitFiberRoot: w,
          onCommitFiberUnmount: w,
          inject(e) {
            const t = ++r;
            return n.set(t, e), t;
          },
        }),
        (window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = t));
      const o = t.onCommitFiberRoot;
      return (
        (t.onCommitFiberRoot = (t, n) => {
          o && o(t, n), e(t, n);
        }),
        t
      );
    },
    x = 'Menlo,Consolas,Monaco,Liberation Mono,Lucida Console,monospace',
    E = '115,97,230',
    O = !1,
    j = [],
    k = null,
    R = [],
    P = (e) => `${e.rect.top}-${e.rect.left}-${e.rect.width}-${e.rect.height}`,
    T = (e) => {
      let t, n, r;
      if (
        !e ||
        !((e) => {
          let t, n, r;
          if (!e) return !0;
          const o =
              ((t = e.alternate) == null ? void 0 : t.memoizedProps) || {},
            l = e.memoizedProps || {},
            i = !(
              1 &
              ~((r = (n = e.flags) != null ? n : e.effectTag) != null ? r : 0)
            );
          switch (e.tag) {
            case 1:
            case 0:
            case 9:
            case 11:
              return i;
            case 14:
            case 15:
              if (typeof e.type.compare === 'function')
                {return !e.type.compare(o, l);}
              if (o && typeof o === 'object')
                {for (const e in s(s({}, o), l))
                  {if (!Object.is(o[e], l[e])) return !0;}}
              return i;
            default:
              return (
                !e.alternate ||
                o !== l ||
                e.alternate.memoizedState !== e.memoizedState ||
                e.alternate.ref !== e.ref
              );
          }
        })(e) ||
        O
      )
        {return null;}
      if (!$(e.type)) return null;
      const o = [],
        l = ['function', 'object'];
      let i = !1;
      const u = (t = e.alternate) == null ? void 0 : t.memoizedProps,
        a = e.memoizedProps;
      for (const e in s(s({}, u), a)) {
        const t = u == null ? void 0 : u[e],
          n = a == null ? void 0 : a[e];
        if (
          Object.is(t, n) ||
          h.isValidElement(t) ||
          h.isValidElement(n) ||
          e === 'children'
        )
          {continue;}
        const r = { name: e, prevValue: t, nextValue: n, unstable: !1 };
        o.push(r);
        const c = g(t),
          s = g(n);
        l.includes(typeof t) &&
          l.includes(typeof n) &&
          c === s &&
          ((i = !0), (r.unstable = !0));
      }
      if (!o.length) return null;
      let c = _(e, (e) => typeof e.type === 'string');
      if ((c || (c = _(e, (e) => typeof e.type === 'string', !0)), !c))
        {return null;}
      const f = c.stateNode;
      if (!(f instanceof HTMLElement)) return null;
      if (
        f.tagName.toLowerCase().includes('million') ||
        f.hasAttribute('data-react-scan-ignore')
      )
        {return null;}
      const p = window.getComputedStyle(f);
      if (
        p.display === 'none' ||
        p.visibility === 'hidden' ||
        p.opacity === '0'
      )
        {return null;}
      const d = f.getBoundingClientRect();
      if (
        !(
          d.top >= 0 ||
          d.left >= 0 ||
          d.bottom <= window.innerHeight ||
          d.right <= window.innerWidth
        )
      )
        {return null;}
      if (!d.height || !d.width) return null;
      const m = (n = S(e.type)) != null ? n : '',
        y = (r = e.updateQueue) == null ? void 0 : r.memoCache,
        { totalTime: b, selfTime: v } = ((e) => {
          let t, n, r;
          const o = (t = e == null ? void 0 : e.actualDuration) != null ? t : 0;
          let l = o,
            i = (n = e == null ? void 0 : e.child) != null ? n : null;
          for (; o > 0 && i != null; )
            {(l -= (r = i.actualDuration) != null ? r : 0), (i = i.sibling);}
          return { totalTime: o, selfTime: l };
        })(e);
      let w = null,
        C = null;
      for (let e = 0, t = o.length; e < t; e++) {
        const { name: t, prevValue: n, nextValue: r, unstable: l } = o[e];
        l &&
          (w != null || (w = {}),
          C != null || (C = {}),
          (w[`${t} (prev)`] = n),
          (C[`${t} (next)`] = r));
      }
      return {
        rect: d,
        names: new Set([m]),
        count: 1,
        totalTime: b,
        selfTime: v,
        unstable: i,
        forget: y,
        trigger: !1,
        prevChangedProps: w,
        nextChangedProps: C,
      };
    },
    L = (e, t = new Map()) => {
      const { clearLog: n } = D();
      if ((n && console.clear(), !R.length)) return;
      const r = R;
      (R = []),
        requestAnimationFrame(() => {
          d(void 0, null, function* () {
            const n = R;
            R = [];
            const o = n
                ? ((e) => {
                    const t = new Map();
                    for (let n = 0, r = e.length; n < r; n++) {
                      const r = e[n],
                        o = P(r),
                        l = t.get(o);
                      l
                        ? (r.names.forEach((e) => {
                            l.names.add(e);
                          }),
                          (l.count += r.count),
                          (l.totalTime += r.totalTime),
                          (l.selfTime += r.selfTime))
                        : t.set(o, r);
                    }
                    return Array.from(t.values());
                  })([...r, ...n])
                : r,
              l = new Map();
            yield Promise.all(
              o.map((n) =>
                d(void 0, null, function* () {
                  const r = P(n);
                  t.has(r) || (yield F(e, n), l.set(r, n));
                }),
              ),
            ),
              R.length && L(e, l);
          });
        });
    },
    F = (e, t) =>
      new Promise((n) => {
        const {
            unstable: r,
            names: o,
            count: l,
            trigger: i,
            forget: u,
            prevChangedProps: a,
            nextChangedProps: c,
          } = t,
          s = r ? 30 : 10;
        let f = null;
        o.size &&
          ((f = Array.from(o.values())
            .filter((e) => typeof e === 'string' && e.trim())
            .slice(0, 3)
            .join(', ')),
          f.length > 20 && (f = `${f.slice(0, 20)}…`),
          l > 1 && (f += ` ×${l}`),
          i && (f = `🔥 ${f}`),
          u && (f = `${f} ✨`));
        const { log: p } = D();
        f &&
          a &&
          c &&
          p &&
          (console.group(
            `%c${f}`,
            'background: hsla(0,0%,70%,.3); border-radius:3px; padding: 0 2px;',
          ),
          console.log('Memoize these props:'),
          console.log(a, '!==', c),
          console.groupEnd()),
          j.push({
            outline: t,
            alpha: 0.8,
            frame: 0,
            totalFrames: s,
            resolve: n,
            text: f,
          }),
          k || M(e);
      }),
    M = (e) => {
      e.clearRect(0, 0, e.canvas.width, e.canvas.height);
      const t = new Path2D();
      let n = 0,
        r = 0;
      const o = [];
      for (let e = j.length - 1; e >= 0; e--) {
        const l = j[e],
          { outline: i, frame: u, totalFrames: a } = l,
          { rect: c, unstable: s } = i,
          f = s ? 0.8 : 0.2;
        (l.alpha = f * (1 - u / a)),
          (n = Math.max(n, l.alpha)),
          (r = Math.max(r, 0.1 * l.alpha)),
          t.rect(c.x, c.y, c.width, c.height),
          s && o.push({ alpha: l.alpha, outline: i, text: l.text }),
          l.frame++,
          l.frame > l.totalFrames && (j.splice(e, 1), l.resolve());
      }
      e.save(),
        (e.strokeStyle = `rgba(${E}, ${n})`),
        (e.lineWidth = 1),
        (e.fillStyle = `rgba(${E}, ${r})`),
        e.stroke(t),
        e.fill(t),
        e.restore();
      for (let t = 0, n = o.length; t < n; t++) {
        const { alpha: n, outline: r, text: l } = o[t],
          { rect: i } = r;
        if ((e.save(), l)) {
          e.font = `10px ${x}`;
          const t = e.measureText(l).width,
            r = 10,
            o = i.x,
            u = i.y - r - 4;
          (e.fillStyle = `rgba(${E},${n})`),
            e.fillRect(o, u, t + 4, r + 4),
            (e.fillStyle = `rgba(255,255,255,${n})`),
            e.fillText(l, o + 2, u + r);
        }
        e.restore();
      }
      k = j.length ? requestAnimationFrame(() => M(e)) : null;
    },
    A = (e) => {
      const t = document.createElement('template');
      return (t.innerHTML = e), t.content.firstChild;
    },
    I = () => {
      const e = A(
          '<canvas id="react-scan-canvas" style="position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483646" aria-hidden="true"/>',
        ),
        t = e.getContext('2d');
      let n = !1;
      const r = () => {
        const r = window.devicePixelRatio;
        (e.width = r * window.innerWidth),
          (e.height = r * window.innerHeight),
          t == null || t.scale(r, r),
          (n = !1);
      };
      let o;
      return (
        r(),
        window.addEventListener('resize', () => {
          n ||
            ((n = !0),
            requestAnimationFrame(() => {
              r();
            }));
        }),
        (o = () => {
          const t = document.getElementById('react-scan-canvas');
          t && t.remove(), document.documentElement.appendChild(e);
        }),
        'scheduler' in globalThis
          ? globalThis.scheduler.postTask(o, { priority: 'background' })
          : 'requestIdleCallback' in window
            ? requestIdleCallback(o)
            : setTimeout(o, 0),
        t
      );
    },
    z = {
      enabled: !0,
      includeChildren: !0,
      log: !1,
      clearLog: !1,
      production: !1,
    },
    V = z,
    D = () => V,
    q = null,
    N = !1,
    U = (e, t) => {};
  typeof window !== 'undefined' &&
    C({
      onCommitFiberRoot: (e, t) => {
        U(e, t);
      },
    });
  const B = (e = z) => {
    if (!(V = e != null ? e : V).production && '_self' in v) return;
    if (
      N ||
      (() => {
        try {
          return window.self !== window.top;
        } catch (e) {
          return !0;
        }
      })() ||
      !1 === V.enabled
    )
      {return;}
    (N = !0),
      console.log(
        '%cTry Million Lint to automatically optimize your app: https://million.dev',
        `font-weight:bold;font-size:14px;font-weight:bold;font-family:${x}`,
      );
    const t = I(),
      n = (() => {
        const e = A(
          `<div id="react-scan-status" title="Number of unnecessary renders and time elapsed" style="position:fixed;bottom:3px;right:3px;background:rgba(0,0,0,0.5);padding:4px 8px;border-radius:4px;color:white;z-index:2147483647;font-family:${x}" aria-hidden="true">hide scanner</div>`,
        );
        let t = localStorage.getItem('react-scan-hidden') === 'true';
        const n = () => {
          const n = document.getElementById('react-scan-canvas');
          n &&
            ((n.style.display = t ? 'none' : 'block'),
            (e.textContent = t ? 'start ►' : 'stop ⏹'),
            (O = t) && ((j = []), (R = [])),
            localStorage.setItem('react-scan-hidden', t.toString()));
        };
        n(),
          e.addEventListener('click', () => {
            (t = !t), n();
          }),
          e.addEventListener('mouseenter', () => {
            (e.textContent = t ? 'start ►' : 'stop ⏹'),
              (e.style.backgroundColor = 'rgba(0,0,0,1)');
          }),
          e.addEventListener('mouseleave', () => {
            e.style.backgroundColor = 'rgba(0,0,0,0.5)';
          });
        const r = document.getElementById('react-scan-status');
        return r && r.remove(), document.documentElement.appendChild(e), e;
      })(),
      r = (e, r) => {
        const o = [];
        let l = 0,
          i = 0;
        const u = (e) => {
          let t;
          const n = T(e);
          if (!n) return null;
          const r =
            (t = q == null ? void 0 : q.has(e.type)) != null
              ? t
              : q == null
                ? void 0
                : q.has(e.elementType);
          if (q) {
            if (
              !_(
                e,
                (e) => {
                  let t;
                  const n =
                    (t = q == null ? void 0 : q.get(e.type)) != null
                      ? t
                      : q == null
                        ? void 0
                        : q.get(e.elementType);
                  return n == null ? void 0 : n.includeChildren;
                },
                !0,
              ) &&
              !r
            )
              {return null;}
          }
          return o.push(n), n;
        };
        if (r.memoizedUpdaters)
          {for (const e of r.memoizedUpdaters) {
            const t = u(e);
            t && (t.trigger = !0);
          }}
        _(r.current, (e) => {
          u(e);
        });
        const a = ((e) => ((R = e), e))([...R, ...o]);
        if (a.length && t) {
          for (let e = 0, t = a.length; e < t; e++) {
            const t = a[e];
            (l += t.selfTime), (i += t.count);
          }
          let e = `×${i}`;
          l > 0 && (e += ` (${l.toFixed(2)}ms)`),
            (n.textContent = `${e} · react-scan`),
            L(t);
        }
      };
    C({
      onCommitFiberRoot: (U = (e, t) => {
        try {
          r(0, t);
        } catch (e) {}
      }),
    });
  };
  typeof window !== 'undefined' && (B(), (window.reactScan = B)),
    /*! Bundled license information:

  react/cjs/react.production.min.js:
    (**
     * @license React
     * react.production.min.js
     *
     * Copyright (c) Facebook, Inc. and its affiliates.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     *)
  */ (e.getCurrentOptions = D),
    (e.scan = B),
    (e.withScan = (e, t = z) => (
      t.log != null || (t.log = !0),
      B(t),
      q || (q = new Map()),
      q.set($(e), t),
      e
    ));
})({});
