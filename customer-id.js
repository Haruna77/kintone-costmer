/**
 * @name Customer ID Generator
 * @description
 * This script is for the "Purchaser Information" app.
 * When a new record is successfully created, it takes the record number,
 * formats it with a prefix and zero-padding, and updates the "purchaser_id" field.
 *
 * @trigger app.record.create.submit.success on the "Purchaser Information" app.
 */
(function() {
  'use strict';

  // ===================================================================================
  // 設定箇所 (User Configuration)
  // ===================================================================================
  // ★要設定: 顧客IDを保存するフィールドのフィールドコード
  const CUSTOMER_ID_FIELD = 'purchaser_id';

  // ★要設定: 顧客IDの接頭辞（プレフィックス）
  const ID_PREFIX = 'C-';

  // ★要設定: IDの桁数（ゼロ埋め）
  const PADDING_LENGTH = 7;
  // ===================================================================================

  kintone.events.on('app.record.create.submit.success', async (event) => {
    console.log('Customer ID Generator triggered.');
    const record = event.record;
    const recordId = event.recordId;

    // 既に顧客IDが何らかの理由で入力されている場合は、処理を中断
    if (record[CUSTOMER_ID_FIELD].value) {
      console.log('Customer ID already exists. Skipping generation.');
      return event;
    }

    try {
      // レコード番号を元に、新しい顧客IDを生成
      const newId = ID_PREFIX + String(recordId).padStart(PADDING_LENGTH, '0');
      console.log(`Generated new ID: ${newId} for Record ID: ${recordId}`);

      // このレコード自身の顧客IDフィールドを更新するためのAPIリクエストを作成
      const params = {
        app: kintone.app.getId(),
        id: recordId,
        record: {
          [CUSTOMER_ID_FIELD]: {
            value: newId
          }
        }
      };

      // レコードを更新
      await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params);
      console.log('Successfully updated the record with the new Customer ID.');

    } catch (error) {
      console.error('Failed to update record with Customer ID.', error);
      // ここでエラーを出してしまうと画面にエラーが表示されてしまうため、ログ出力に留める
      // ユーザーは画面をリロードすれば生成されたIDを確認できる
    }

    return event;
  });

})();


/**
 * @name Purchaser Info Automation
 * @description
 * This script is for the "Purchaser Information" app (購入者情報).
 * It checks the purchase history table for a specific keyword ("バックエンド").
 * If the keyword is found, it populates a specified text field with "ONE生徒".
 *
 * @trigger on record create/edit screen, record detail screen, and when the table is modified.
 */
(function() {
  'use strict';

  // ===================================================================================
  // 設定箇所 (User Configuration)
  // ===================================================================================
  // ★要設定: 購入履歴が入力されているテーブルのフィールドコード
  const TABLE_FIELD_CODE = 'テーブル_決済管理表の情報_購入履歴';

  // ★要設定: テーブル内にある「商品種別」のフィールドコード
  const PRODUCT_TYPE_IN_TABLE = '文字列__1行_商品種別';

  // ★要設定: 分類結果を表示するテーブル外のフィールドコード（文字列1行）
  const TARGET_FIELD_CODE = '自動入力_ONE入会有無';

  // ★要設定: 検索したいキーワード
  const KEYWORD = 'バックエンド';

  // ★要設定: キーワードが見つかった場合に設定するテキスト
  const TEXT_TO_SET = 'ONE生徒';
  // ===================================================================================

  // スクリプトを実行するイベントを指定
  const events = [
    `app.record.create.change.${TABLE_FIELD_CODE}`,
    `app.record.edit.change.${TABLE_FIELD_CODE}`,
    'app.record.create.show',
    'app.record.edit.show',
    'app.record.detail.show'
  ];

  const checkTableAndSetField = (event) => {
    const record = event.record;

    // ターゲットフィールドが存在しない場合は処理を中断
    if (!record[TARGET_FIELD_CODE]) {
      return event;
    }
    
    const table = record[TABLE_FIELD_CODE].value;
    let isFound = false;

    // テーブルの各行をループしてキーワードを探す
    for (const row of table) {
      if (row.value[PRODUCT_TYPE_IN_TABLE] && row.value[PRODUCT_TYPE_IN_TABLE].value) {
        const productType = row.value[PRODUCT_TYPE_IN_TABLE].value;
        
        if (productType.includes(KEYWORD)) {
          isFound = true;
          break; // 一つでも見つかればループを抜ける
        }
      }
    }

    // 見つかったかどうかに応じて、ターゲットフィールドの値を設定
    if (isFound) {
      record[TARGET_FIELD_CODE].value = TEXT_TO_SET;
    } else {
      // 見つからなかった場合、フィールドを空にする
      record[TARGET_FIELD_CODE].value = '';
    }

    return event;
  };

  kintone.events.on(events, checkTableAndSetField);

})();
