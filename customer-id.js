/**
 * @name Customer ID Generator & Info Automation
 * @description
 * This script is for the "Purchaser Information" app.
 * 1. Generates a unique customer ID when a new record is created manually.
 * 2. Automatically sets the "ONE生徒" field based on the purchase history table content.
 * 3. Automatically sets the "集客者" field based on a priority of source fields.
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
    // ターゲットフィールド（ここに自動入力する）
    const TARGET_FIELD = '自動入力_集客者';

    // 優先順位リスト（上から順にチェックされる）
    const PRIORITY_FIELDS = [
      '集客者_ルックアップ',
      'ルックアップ_登録経路_自社広告・自社SNS',
      '文字列__1行_登録経路_手入力用'
    ];
    // --- 設定ここまで ---

    // 参照元フィールドが変更されたときにも動くようにイベントを動的に作成
    const sourceFieldChangeEvents = PRIORITY_FIELDS.map(fieldCode => {
      return `app.record.create.change.${fieldCode}`;
    }).concat(PRIORITY_FIELDS.map(fieldCode => {
      return `app.record.edit.change.${fieldCode}`;
    }));

    const events = [
      'app.record.create.show',
      'app.record.edit.show',
      'app.record.detail.show',
      'app.record.create.submit',
      'app.record.edit.submit'
    ].concat(sourceFieldChangeEvents);

    const setReferrerField = (event) => {
      const record = event.record;
      if (!record[TARGET_FIELD]) return event;

      let foundValue = '';

      // 優先順位リストを順番にチェック
      for (const fieldCode of PRIORITY_FIELDS) {
        // フィールドが存在し、値が空でないかを確認
        if (record[fieldCode] && record[fieldCode].value) {
          foundValue = record[fieldCode].value;
          break; // 値が見つかったらループを抜ける
        }
      }

      record[TARGET_FIELD].value = foundValue;
      return event;
    };

    kintone.events.on(events, setReferrerField);
  })();

})();

