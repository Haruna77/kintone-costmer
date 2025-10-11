/**
 * @name Customer ID Generator & Info Automation
 * @description
 * This script is for the "Purchaser Information" app.
 * 1. Generates a unique customer ID when a new record is created manually.
 * 2. Automatically sets the "ONE生徒" field based on the purchase history table content.
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
      // ▼▼▼【変更点】▼▼▼
      // レコード保存直前のイベントを追加し、初回のレコード登録時にも確実に実行されるようにします。
      'app.record.create.submit',
      'app.record.edit.submit'
      // ▲▲▲【変更ここまで】▲▲▲
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

})();

