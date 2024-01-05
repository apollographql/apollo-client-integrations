import "../logo.css";
import React from "react";

export function Logo() {
  return (
    <svg
      width="200"
      height="50"
      viewBox="0 0 100 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M11.5 0.288675C11.8094 0.110043 12.1906 0.110042 12.5 0.288675L21.8923 5.71132C22.2017 5.88996 22.3923 6.22008 22.3923 6.57735V17.4226C22.3923 17.7799 22.2017 18.11 21.8923 18.2887L12.5 23.7113C12.1906 23.89 11.8094 23.89 11.5 23.7113L2.1077 18.2887C1.7983 18.11 1.6077 17.7799 1.6077 17.4226V6.57735C1.6077 6.22009 1.79829 5.88996 2.1077 5.71132L11.5 0.288675Z"
        fill="#1B2240"
      />
      <circle className="star s1" cx="11" cy="3" r="1" />
      <circle className="star s2" cx="7" cy="18" r="1" />
      <circle className="star s3" cx="21" cy="12" r=".75" />
      <circle className="star s4" cx="14" cy="20" r=".75" />
      <path
        className="planet"
        d="M17.2999 12C17.2999 14.8995 14.9635 17.25 12.0814 17.25C9.19928 17.25 6.86287 14.8995 6.86287 12C6.86287 9.10051 9.19928 6.75 12.0814 6.75C14.9635 6.75 17.2999 9.10051 17.2999 12Z"
        fill="white"
      />
      <path
        className="ring"
        d="M6.87368 12.3527C6.85069 12.0148 6.86073 11.6795 6.90152 11.351C5.30645 12.1429 4.36556 13.073 4.51548 13.8917C4.78019 15.3374 8.34567 15.8884 12.4792 15.1224C16.6127 14.3563 19.749 12.5634 19.4843 11.1177C19.3457 10.3607 18.302 9.84897 16.7457 9.64324C16.8936 9.94029 17.0154 10.2557 17.1075 10.5875C17.5822 10.6793 17.9554 10.8017 18.2229 10.9384C18.6024 11.1323 18.6289 11.2762 18.6289 11.2762C18.6289 11.2762 18.6535 11.4004 18.4178 11.6815C18.1873 11.9565 17.7865 12.2796 17.2014 12.6141C16.0386 13.2789 14.3189 13.8917 12.3216 14.2618C10.3243 14.632 8.50044 14.6759 7.17858 14.4716C6.51337 14.3688 6.02446 14.2105 5.71161 14.0362C5.39271 13.8585 5.37084 13.7332 5.37084 13.7332C5.37084 13.7332 5.34393 13.5683 5.68303 13.2157C5.94114 12.9473 6.33897 12.6513 6.87368 12.3527Z"
        fill="#AD9BF6"
      />
      <path
        d="M33.162 17V7.844H38.692V9.216H34.786V11.806H38.118V13.178H34.786V17H33.162ZM41.6987 17V7.844H43.3227V15.628H47.1307V17H41.6987ZM50.5173 17V13.598L47.7733 7.844H49.5093L50.5033 10.182C50.634 10.5273 50.7646 10.8633 50.8953 11.19C51.026 11.5073 51.166 11.8433 51.3153 12.198H51.3713C51.5206 11.8433 51.6653 11.5073 51.8053 11.19C51.9453 10.8633 52.0806 10.5273 52.2113 10.182L53.2053 7.844H54.8993L52.1413 13.598V17H50.5173ZM57.405 17V7.844H60.331C60.9656 7.844 61.5256 7.914 62.011 8.054C62.5056 8.194 62.893 8.432 63.173 8.768C63.4623 9.09467 63.607 9.538 63.607 10.098C63.607 10.5273 63.495 10.9333 63.271 11.316C63.047 11.6893 62.7343 11.946 62.333 12.086V12.142C62.837 12.254 63.2523 12.492 63.579 12.856C63.915 13.2107 64.083 13.696 64.083 14.312C64.083 14.9187 63.929 15.4227 63.621 15.824C63.3223 16.2253 62.907 16.524 62.375 16.72C61.843 16.9067 61.241 17 60.569 17H57.405ZM59.029 11.624H60.191C60.8256 11.624 61.2876 11.5073 61.577 11.274C61.8663 11.0407 62.011 10.728 62.011 10.336C62.011 9.888 61.8616 9.57067 61.563 9.384C61.2643 9.19733 60.8163 9.104 60.219 9.104H59.029V11.624ZM59.029 15.74H60.401C61.073 15.74 61.591 15.6187 61.955 15.376C62.319 15.124 62.501 14.7413 62.501 14.228C62.501 13.7427 62.3236 13.3927 61.969 13.178C61.6143 12.954 61.0916 12.842 60.401 12.842H59.029V15.74ZM68.4657 17V13.598L65.7217 7.844H67.4577L68.4517 10.182C68.5824 10.5273 68.7131 10.8633 68.8437 11.19C68.9744 11.5073 69.1144 11.8433 69.2637 12.198H69.3197C69.4691 11.8433 69.6137 11.5073 69.7537 11.19C69.8937 10.8633 70.0291 10.5273 70.1597 10.182L71.1537 7.844H72.8477L70.0897 13.598V17H68.4657Z"
        fill="#1B2240"
      />
      <rect className="rect" fill="#fff" width="10" height="25px" />
    </svg>
  );
}
