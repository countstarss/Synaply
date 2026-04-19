/**
 * Infobar 显示配置
 * 定义哪些路由不显示 Infobar
 */

export interface InfobarConfig {
  // 精确匹配的路由（不显示Infobar）
  hiddenRoutes: string[];
  // 前缀匹配的路由（不显示Infobar）
  hiddenPrefixes: string[];
  // 正则表达式匹配的路由（不显示Infobar）
  hiddenPatterns?: RegExp[];
}

export const infobarConfig: InfobarConfig = {
  // 精确匹配的路由
  hiddenRoutes: [],

  // 前缀匹配的路由
  hiddenPrefixes: [],

  // 可选：正则表达式匹配
  hiddenPatterns: [
    // 示例：匹配所有以 /admin/users/ 开头后跟数字的路由
    // /^\/admin\/users\/\d+/
  ],
};

/**
 * 检查给定路径是否应该隐藏 Infobar
 * @param path 当前路径
 * @returns 是否应该隐藏 Infobar
 */
export function shouldHideInfobar(path: string): boolean {
  // 移除语言前缀，获取实际路由路径
  // 例如: /en/projects -> /projects, /zh/settings -> /settings
  const pathWithoutLocale = path.replace(/^\/[a-z]{2}(?=\/|$)/, "");

  // 检查精确匹配
  if (infobarConfig.hiddenRoutes.includes(pathWithoutLocale)) {
    return true;
  }

  // 检查前缀匹配
  if (
    infobarConfig.hiddenPrefixes.some((prefix) =>
      pathWithoutLocale.startsWith(prefix)
    )
  ) {
    return true;
  }

  // 检查正则表达式匹配（如果有配置）
  if (
    infobarConfig.hiddenPatterns?.some((pattern) =>
      pattern.test(pathWithoutLocale)
    )
  ) {
    return true;
  }

  return false;
}

/**
 * 添加新的隐藏路由规则
 * @param route 要隐藏的路由
 * @param type 匹配类型：'exact' | 'prefix' | 'pattern'
 */
export function addHiddenRoute(
  route: string | RegExp,
  type: "exact" | "prefix" | "pattern" = "exact"
) {
  if (typeof route === "string") {
    switch (type) {
      case "exact":
        if (!infobarConfig.hiddenRoutes.includes(route)) {
          infobarConfig.hiddenRoutes.push(route);
        }
        break;
      case "prefix":
        if (!infobarConfig.hiddenPrefixes.includes(route)) {
          infobarConfig.hiddenPrefixes.push(route);
        }
        break;
    }
  } else if (route instanceof RegExp && type === "pattern") {
    if (!infobarConfig.hiddenPatterns) {
      infobarConfig.hiddenPatterns = [];
    }
    infobarConfig.hiddenPatterns.push(route);
  }
}

/**
 * 移除隐藏路由规则
 * @param route 要移除的路由
 * @param type 匹配类型
 */
export function removeHiddenRoute(
  route: string | RegExp,
  type: "exact" | "prefix" | "pattern" = "exact"
) {
  if (typeof route === "string") {
    switch (type) {
      case "exact":
        const exactIndex = infobarConfig.hiddenRoutes.indexOf(route);
        if (exactIndex > -1) {
          infobarConfig.hiddenRoutes.splice(exactIndex, 1);
        }
        break;
      case "prefix":
        const prefixIndex = infobarConfig.hiddenPrefixes.indexOf(route);
        if (prefixIndex > -1) {
          infobarConfig.hiddenPrefixes.splice(prefixIndex, 1);
        }
        break;
    }
  } else if (
    route instanceof RegExp &&
    type === "pattern" &&
    infobarConfig.hiddenPatterns
  ) {
    const patternIndex = infobarConfig.hiddenPatterns.findIndex(
      (p) => p.toString() === route.toString()
    );
    if (patternIndex > -1) {
      infobarConfig.hiddenPatterns.splice(patternIndex, 1);
    }
  }
}
