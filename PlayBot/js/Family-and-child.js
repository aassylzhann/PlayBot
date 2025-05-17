document.addEventListener("DOMContentLoaded", function () {
  // 语言切换功能
  const languageSwitcher = document.querySelector(".language-switcher");
  if (languageSwitcher) {
    languageSwitcher.addEventListener("click", function (e) {
      e.preventDefault();
      const lang = this.getAttribute("data-lang");
      switchLanguage(lang);
      // 切换后重置Show Area的选项卡状态
      resetShowAreaTabs(lang);
    });
  }

  // 切换语言函数
  function switchLanguage(lang) {
    document.querySelectorAll(".lang-content").forEach(content => {
      content.style.display = "none";
    });
    document.querySelector(`.lang-content[data-lang="${lang}"]`).style.display = "block";
  }

  // 根据语言和主选项卡获取默认子选项卡ID
  function getDefaultSubTab(mainTabId, lang) {
    const defaults = {
      en: {
        tabE1: "sub-tabE1", // Electricity or not -> Plugged
        tabE2: "sub-tabE3", // Levels -> Advanced
        tabE3: "sub-tabE6"  // TOP PRODUCTS -> Making Card
      },
      zh: {
        tab1: "sub-tab1",   // 是否插电 -> 插電
        tab2: "sub-tab3",   // 等级 -> 高级
        tab3: "sub-tab6"    // 顶级产品 -> 制作卡片
      }
    };
    return defaults[lang]?.[mainTabId];
  }

  // 重置Show Area选项卡状态
  function resetShowAreaTabs(lang) {
    const showArea = document.querySelector(".Show__area .lang-content[data-lang='" + lang + "']");
    
    if (showArea) {
      // 重置所有选项卡状态
      showArea.querySelectorAll(".tab-title, .sub-tab-title, .tab-pane, .sub-tab-pane")
        .forEach(el => el.classList.remove("active"));

      // 根据语言激活默认主选项卡
      let defaultMainTabId, defaultSubTabId;
      
      if (lang === "en") {
        defaultMainTabId = "tabE1"; // Electricity or not
        defaultSubTabId = "sub-tabE1"; // Plugged
      } else if (lang === "zh") {
        defaultMainTabId = "tab1"; // 是否插电
        defaultSubTabId = "sub-tab1"; // 插電
      }

      if (defaultMainTabId) {
        const mainTab = showArea.querySelector(`.tab-title[data-tab='${defaultMainTabId}']`);
        if (mainTab) {
          mainTab.classList.add("active");
          showArea.querySelector(`#${defaultMainTabId}`).classList.add("active");
          
          // 激活默认子选项卡
          const subTab = showArea.querySelector(`.sub-tab-title[data-sub-tab='${defaultSubTabId}']`);
          if (subTab) {
            subTab.classList.add("active");
            showArea.querySelector(`#${defaultSubTabId}`).classList.add("active");
          }
        }
      }
    }
  }

  // 初始加载时设置正确的语言和选项卡状态
  const defaultLang = document.querySelector(".lang-content[data-lang='en']").style.display === "none" ? "zh" : "en";
  resetShowAreaTabs(defaultLang);

  // 选项卡切换功能（仅作用于Show Area）
  document.querySelectorAll(".Show__area .tab-title").forEach(tab => {
    tab.addEventListener("click", function (e) {
      e.preventDefault();
      const tabContainer = this.closest(".tab-container");
      const targetTabId = this.getAttribute("data-tab");
      const lang = this.closest(".lang-content").getAttribute("data-lang");

      // 移除所有标题的激活状态
      tabContainer.querySelectorAll(".tab-title").forEach(title => title.classList.remove("active"));
      // 添加当前标题的激活状态
      this.classList.add("active");

      // 隐藏所有内容区域
      tabContainer.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
      // 显示目标内容区域
      tabContainer.querySelector(`#${targetTabId}`).classList.add("active");

      // 激活默认子选项卡
      const defaultSubTabId = getDefaultSubTab(targetTabId, lang);
      if (defaultSubTabId) {
        const defaultSubTab = tabContainer.querySelector(`#${targetTabId} .sub-tab-title[data-sub-tab='${defaultSubTabId}']`);
        if (defaultSubTab) {
          // 移除所有子标题的激活状态
          tabContainer.querySelectorAll(".sub-tab-title").forEach(title => title.classList.remove("active"));
          // 添加当前子标题的激活状态
          defaultSubTab.classList.add("active");

          // 隐藏所有子内容区域
          tabContainer.querySelectorAll(".sub-tab-pane").forEach(pane => pane.classList.remove("active"));
          // 显示目标子内容区域
          tabContainer.querySelector(`#${defaultSubTabId}`).classList.add("active");
        }
      }
    });
  });

  // 子选项卡切换功能
  document.querySelectorAll(".Show__area .sub-tab-title").forEach(subTab => {
    subTab.addEventListener("click", function (e) {
      e.preventDefault();
      const subTabContainer = this.closest(".sub-tab-container");
      const targetSubTabId = this.getAttribute("data-sub-tab");

      // 移除所有子标题的激活状态
      subTabContainer.querySelectorAll(".sub-tab-title").forEach(title => title.classList.remove("active"));
      // 添加当前子标题的激活状态
      this.classList.add("active");

      // 隐藏所有子内容区域
      subTabContainer.querySelectorAll(".sub-tab-pane").forEach(pane => pane.classList.remove("active"));
      // 显示目标子内容区域
      subTabContainer.querySelector(`#${targetSubTabId}`).classList.add("active");
    });
  });
});