/**
 * @name Customer ID Generator & Info Automation
 * @description
 * This script is for the "Purchaser Information" app.
 * 1. Generates a unique customer ID when a new record is created manually.
 * 2. Automatically sets the "ONE生徒" field based on the purchase history table content.
 * 3. Automatically sets the "集客者" field based on a priority of source fields.
 * 4. Automatically sets the "集客媒体" field based on a priority of source fields.
 */
(function() {
  'use strict';

  // --- 機能1: 顧客IDの自動生成 ------------------------------------------
  /**
   * @name Customer ID Generator
   * @trigger app.record.create.submit.success
   */
  (function() {
    // --- 設定箇所 ---
    const CUSTOMER_ID_FIELD = 'purchaser_id';
    const ID_PREFIX = 'C-';
    const PADDING_LENGTH = 7;
    // --- 設定ここまで ---

    kintone.events.on('app.record.create.submit.success', async (event) => {
      console.log('機能1: Customer ID Generator triggered.');
      const record = event.record;
      const recordId = event.recordId;

      if (record[CUSTOMER_ID_FIELD].value) {
        console.log('機能1: Customer ID already exists. Skipping generation.');
        return event;
      }
      try {
        const newId = ID_PREFIX + String(recordId).padStart(PADDING_LENGTH, '0');
        const params = {
          app: kintone.app.getId(),
          id: recordId,
          record: {
            [CUSTOMER_ID_FIELD]: { value: newId }
          }
        };
        await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params);
        console.log('機能1: Successfully updated the record with the new Customer ID.');
      } catch (error) {
        console.error('機能1: Failed to update record with Customer ID.', error);
      }
      return event;
    });
  })();

  // --- 機能2: ONE生徒の自動入力 ----------------------------------------
  /**
   * @name Purchaser Info Automation
   * @trigger on record create/edit screen, record detail screen, and when the table is modified.
   */
  (function() {
    // --- 設定箇所 ---
    const TABLE_FIELD_CODE = 'テーブル_決済管理表の情報_購入履歴';
    const PRODUCT_TYPE_IN_TABLE = '文字列__1行_商品種別';
    const TARGET_FIELD_CODE = '自動入力_ONE入会有無';
    const KEYWORD = 'バックエンド';
    const TEXT_TO_SET = 'ONE生徒';
    // --- 設定ここまで ---

    const events = [
      `app.record.create.change.${TABLE_FIELD_CODE}`,
      `app.record.edit.change.${TABLE_FIELD_CODE}`,
      'app.record.create.show',
      'app.record.edit.show',
      'app.record.detail.show',
      'app.record.create.submit',
      'app.record.edit.submit'
    ];

    const checkTableAndSetField = (event) => {
      const record = event.record;
      if (!record[TARGET_FIELD_CODE]) return event;

      const table = record[TABLE_FIELD_CODE].value;
      let isFound = false;

      for (const row of table) {
        if (row.value[PRODUCT_TYPE_IN_TABLE] && row.value[PRODUCT_TYPE_IN_TABLE].value) {
          const productType = row.value[PRODUCT_TYPE_IN_TABLE].value;
          if (productType.includes(KEYWORD)) {
            isFound = true;
            break;
          }
        }
      }

      record[TARGET_FIELD_CODE].value = isFound ? TEXT_TO_SET : '';
      return event;
    };

    kintone.events.on(events, checkTableAndSetField);
  })();

  // --- 機能3: 集客者の自動入力 ------------------------------------------
  /**
   * @name Referrer Auto Setter
   * @description Sets the referrer field based on a priority of other fields.
   */
  (function() {
    // --- 設定箇所 ---
    const TARGET_FIELD = '自動入力_集客者';
    const PRIORITY_FIELDS = [
      '集客者_ルックアップ',
      'ルックアップ_登録経路_自社広告・自社SNS',
      '文字列__1行_登録経路_手入力用'
    ];
    // --- 設定ここまで ---

    const sourceFieldChangeEvents = PRIORITY_FIELDS.map(fc => `app.record.create.change.${fc}`).concat(PRIORITY_FIELDS.map(fc => `app.record.edit.change.${fc}`));
    const events = ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show', 'app.record.create.submit', 'app.record.edit.submit'].concat(sourceFieldChangeEvents);

    const setReferrerField = (event) => {
      const record = event.record;
      if (!record[TARGET_FIELD]) return event;
      let foundValue = '';
      for (const fieldCode of PRIORITY_FIELDS) {
        if (record[fieldCode] && record[fieldCode].value) {
          foundValue = record[fieldCode].value;
          break;
        }
      }
      record[TARGET_FIELD].value = foundValue;
      return event;
    };
    kintone.events.on(events, setReferrerField);
  })();

  // --- 機能4: 集客媒体の自動入力 ------------------------------------------
  /**
   * @name Media Auto Setter
   * @description Sets the media field based on a priority of other fields.
   */
  (function() {
    // --- 設定箇所 ---
    const TARGET_FIELD = '自動入力_集客媒体';
    const PRIORITY_FIELDS = [
      '報酬ランク_集客',
      'ルックアップ_集客媒体_集客者の報酬ランク'
    ];
    // --- 設定ここまで ---

    const sourceFieldChangeEvents = PRIORITY_FIELDS.map(fc => `app.record.create.change.${fc}`).concat(PRIORITY_FIELDS.map(fc => `app.record.edit.change.${fc}`));
    const events = ['app.record.create.show', 'app.record.edit.show', 'app.record.detail.show', 'app.record.create.submit', 'app.record.edit.submit'].concat(sourceFieldChangeEvents);

    const setMediaField = (event) => {
      const record = event.record;
      if (!record[TARGET_FIELD]) return event;
      let foundValue = '';
      for (const fieldCode of PRIORITY_FIELDS) {
        if (record[fieldCode] && record[fieldCode].value) {
          foundValue = record[fieldCode].value;
          break;
        }
      }
      record[TARGET_FIELD].value = foundValue;
      return event;
    };
    kintone.events.on(events, setMediaField);
  })();

})();

