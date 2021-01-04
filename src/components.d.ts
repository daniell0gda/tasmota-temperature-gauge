/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "@stencil/core/internal";
import { Log } from "./components/console-component/model";
import { PointOptionsType } from "highcharts";
export namespace Components {
    interface AppHome {
    }
    interface AppSettings {
        "val": number;
    }
    interface ConsoleComponent {
        "update": (log: Log) => Promise<void>;
        "viewOff": () => Promise<void>;
        "viewOn": () => Promise<void>;
    }
    interface MyApp {
    }
    interface SensorTemp {
        "max": number;
        "min": number;
        "update": () => Promise<void>;
        "val": number;
    }
    interface TemperatureChart {
        "_max": number;
        "_min": number;
        "_temps": string;
        "addPoint": (date: number, temp: number) => Promise<void>;
        "viewOff": () => Promise<void>;
        "viewOn": () => Promise<void>;
    }
    interface ThermometerGauge {
        "update": (current: number, min: number, max: number) => Promise<void>;
    }
    interface ViewModeModal {
        "_value": string;
    }
}
declare global {
    interface HTMLAppHomeElement extends Components.AppHome, HTMLStencilElement {
    }
    var HTMLAppHomeElement: {
        prototype: HTMLAppHomeElement;
        new (): HTMLAppHomeElement;
    };
    interface HTMLAppSettingsElement extends Components.AppSettings, HTMLStencilElement {
    }
    var HTMLAppSettingsElement: {
        prototype: HTMLAppSettingsElement;
        new (): HTMLAppSettingsElement;
    };
    interface HTMLConsoleComponentElement extends Components.ConsoleComponent, HTMLStencilElement {
    }
    var HTMLConsoleComponentElement: {
        prototype: HTMLConsoleComponentElement;
        new (): HTMLConsoleComponentElement;
    };
    interface HTMLMyAppElement extends Components.MyApp, HTMLStencilElement {
    }
    var HTMLMyAppElement: {
        prototype: HTMLMyAppElement;
        new (): HTMLMyAppElement;
    };
    interface HTMLSensorTempElement extends Components.SensorTemp, HTMLStencilElement {
    }
    var HTMLSensorTempElement: {
        prototype: HTMLSensorTempElement;
        new (): HTMLSensorTempElement;
    };
    interface HTMLTemperatureChartElement extends Components.TemperatureChart, HTMLStencilElement {
    }
    var HTMLTemperatureChartElement: {
        prototype: HTMLTemperatureChartElement;
        new (): HTMLTemperatureChartElement;
    };
    interface HTMLThermometerGaugeElement extends Components.ThermometerGauge, HTMLStencilElement {
    }
    var HTMLThermometerGaugeElement: {
        prototype: HTMLThermometerGaugeElement;
        new (): HTMLThermometerGaugeElement;
    };
    interface HTMLViewModeModalElement extends Components.ViewModeModal, HTMLStencilElement {
    }
    var HTMLViewModeModalElement: {
        prototype: HTMLViewModeModalElement;
        new (): HTMLViewModeModalElement;
    };
    interface HTMLElementTagNameMap {
        "app-home": HTMLAppHomeElement;
        "app-settings": HTMLAppSettingsElement;
        "console-component": HTMLConsoleComponentElement;
        "my-app": HTMLMyAppElement;
        "sensor-temp": HTMLSensorTempElement;
        "temperature-chart": HTMLTemperatureChartElement;
        "thermometer-gauge": HTMLThermometerGaugeElement;
        "view-mode-modal": HTMLViewModeModalElement;
    }
}
declare namespace LocalJSX {
    interface AppHome {
        "onDomReady"?: (event: CustomEvent<any>) => void;
    }
    interface AppSettings {
        "onSettingChanged"?: (event: CustomEvent<void>) => void;
        "val"?: number;
    }
    interface ConsoleComponent {
    }
    interface MyApp {
    }
    interface SensorTemp {
        "max"?: number;
        "min"?: number;
        "val"?: number;
    }
    interface TemperatureChart {
        "_max"?: number;
        "_min"?: number;
        "_temps"?: string;
    }
    interface ThermometerGauge {
    }
    interface ViewModeModal {
        "_value"?: string;
    }
    interface IntrinsicElements {
        "app-home": AppHome;
        "app-settings": AppSettings;
        "console-component": ConsoleComponent;
        "my-app": MyApp;
        "sensor-temp": SensorTemp;
        "temperature-chart": TemperatureChart;
        "thermometer-gauge": ThermometerGauge;
        "view-mode-modal": ViewModeModal;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "app-home": LocalJSX.AppHome & JSXBase.HTMLAttributes<HTMLAppHomeElement>;
            "app-settings": LocalJSX.AppSettings & JSXBase.HTMLAttributes<HTMLAppSettingsElement>;
            "console-component": LocalJSX.ConsoleComponent & JSXBase.HTMLAttributes<HTMLConsoleComponentElement>;
            "my-app": LocalJSX.MyApp & JSXBase.HTMLAttributes<HTMLMyAppElement>;
            "sensor-temp": LocalJSX.SensorTemp & JSXBase.HTMLAttributes<HTMLSensorTempElement>;
            "temperature-chart": LocalJSX.TemperatureChart & JSXBase.HTMLAttributes<HTMLTemperatureChartElement>;
            "thermometer-gauge": LocalJSX.ThermometerGauge & JSXBase.HTMLAttributes<HTMLThermometerGaugeElement>;
            "view-mode-modal": LocalJSX.ViewModeModal & JSXBase.HTMLAttributes<HTMLViewModeModalElement>;
        }
    }
}
