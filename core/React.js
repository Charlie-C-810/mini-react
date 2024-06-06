function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const testNode = typeof child === 'string' || typeof child === 'number';
        return testNode ? createTextNode(child) : child;
      }),
    },
  };
}

function createTextNode(text, ...children) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children,
    },
  };
}

let nextWork = null;
let root = null;
function render(el, container) {
  nextWork = {
    dom: container,
    props: {
      children: [el],
    },
  };
  root = nextWork;
}

function createDom(fiber) {
  const dom =
    fiber.type == 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(fiber.type);
  const isProperty = (key) => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((name) => {
      if(name.startsWith("on")) {
        const eventType = name.slice(2).toLowerCase()
      console.log("eventType",eventType);
      console.log("fiber.props[name]",fiber.props[name]);
      dom.addEventListener(eventType, fiber.props[name])
      } else {
        dom[name] = fiber.props[name];
      }
    });
  return dom;
}

function workLoop(deadline) {
  let shouldRun = false;
  while (nextWork && !shouldRun) {
    nextWork = performWorkOfUnit(nextWork);
    // 当剩余时间小于1的时候，就执行下个任务
    shouldRun = deadline.timeRemaining() < 1;
  }
  if (!nextWork && root) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performWorkOfUnit(fiber) {
  const isFunctionComponent = typeof fiber.type === 'function';
  if (isFunctionComponent) {
    // 更新函数组件
    updateFunctionComponent(fiber);
  } else {
    // 更新普通节点
    updateHostComponent(fiber);
  }

  // 寻找下一个孩子节点，如果有返回
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果有兄弟节点，返回兄弟节点
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 否则返回父节点
    nextFiber = nextFiber.parent;
  }
}

function commitRoot() {
  commitWork(root.child);
  root = null;
}
function commitWork(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }

  if (fiber.dom) {
    fiberParent.dom.append(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

// 遍历子节点创建fiber
function reconcileChildren(fiber, children) {
  let prevChild = null;
  children.forEach((child, index) => {
    const newFiber = {
      type: child.type,
      props: child.props,
      child: null,
      parent: fiber,
      sibling: null,
      dom: null,
    };

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

const React = {
  createElement,
  render,
};

export default React;
