const N_individuals = 51;    //個体の数
const N_generation  = 10000;  //世代の数
const N_elite       = 9;     //エリート選択でのエリート数
const p_mutation    = 0.005; //突然変異が起こる確率
/*注意：(N-individuals - N_elite)は2以上の偶数でなければならない*/

//配列の初期化
//引数：行数, 列数, 要素の数値
//戻り値：初期化した配列
function init_array(n_row, n_col, elem){
    //1次元配列の場合
    if(n_row == 1){
        var tbl = new Array(n_col).fill(elem);
    }
    //2次元配列の場合
    else{
        var tbl = new Array(n_row);
        for(let i_row = 0; i_row < n_row; i_row++){
            tbl[i_row] = new Array(n_col).fill(elem)
        }
    }
    return tbl
}

//配列の最大値の取得
//引数：1次元配列
//戻り値：配列内最大値
function max_arr(arr){
    var max_value = arr.reduce(function(a, b){
        return Math.max(a, b);
    });
    return max_value;
}

//重み付きランダムで数字を選ぶ
//引数：確率を格納したベクトル，何個選択するか(戻り値の数)，(true:重複あり, false:重複なし)
//戻り値：選択した数値
function random_choice(p_array_, n_choiced, replace){

    //配列内に対象の数値があるか確認
    //戻り値：ある場合)false, ない場合)true
    function no_overlapped(arr, num){
        for(let i = 0; i < arr.length; i++){
            if(arr[i] == num)return false; //配列(arr)内に対象の数値(num)が存在した
        }
        return true; //配列(arr)内に対象の数値(num)が存在しない
    }

    var p_array = init_array(1, p_array_.length, 0);
    var min_val = p_array_.reduce(function(a,b){return Math.min(a,b);});
    for(let i = 0; i < p_array_.length; i++){
        p_array[i] = p_array_[i] / min_val;
    }

    var num_choiced = new Array(n_choiced); //戻り値用の配列[選択する数分]
    var sum = 0;
    var accumulation_p = new Array(p_array.length); //累積確率[p_array_の要素数]
    for(let i = 0; i < p_array.length; i++){
        sum += p_array[i]; //選択確率を加算
        accumulation_p[i] = sum; //累積確率を保存
    }
    
    for(let n = 0; n < n_choiced; n++){
        var pos = Math.random()*sum;

        for(let i = 0; i < p_array.length; i++){

            //重複ありの場合
            if(replace){
                if(pos <= accumulation_p[i]){
                    num_choiced[n] = i; //選ばれた確率のインデックスが保存される
                    break;
                }
            }

            //重複なしの場合
            else{
                //戻り値の配列の要素に重複がないこと確認
                if(pos <= accumulation_p[i] && no_overlapped(num_choiced, i) == true){
                    num_choiced[n] = i; //選ばれた確率のインデックスが保存される
                    break;
                }
                //戻り値の配列の要素に重複があった
                if(pos <= accumulation_p[i] && no_overlapped(num_choiced, i) == false){
                    n--; //for文を終わらせない為
                    break;
                }
            }
        }
    }

    return num_choiced;
}

//配列から数値を検索する
//引数：検索範囲となる配列，検索する数値
//戻り値：検索対象のあるインデックス
function num_where(arr, num_search){
    var index = 999;
    for(let i = 0; i < arr.length; i++){
        if(arr[i] == num_search){
            index = i;
        }
    }
    if(index == 999){
        //エラー状態
    }
    return index;
}

//ソートした結果の配列のインデックスを返す
//引数：配列
//戻り値：ソート結果の配列のインデックス（例：[100, 10, 50, 1] -> [3, 1, 2, 0]）
function argsort(array) {
    const arrayObject = array.map((value, idx) => { return { value, idx }; });
    arrayObject.sort((a, b) => {
        if (a.value < b.value) {
            return -1;
        }
        if (a.value > b.value) {
            return 1;
        }
        return 0;
    });
    const argIndices = arrayObject.map(data => data.idx);
    return argIndices;
}

//個体を引数分だけ生成する(初期化)，各個体にはランダム順序のタスクが格納されている
//引数：個体の数，タスクの数
//戻り値：個体を格納した行列
function generate_init_genes(n_individuals, n_task){
    //重複の無い数列を生成
    function make_array(){
        //タスク数だけ連番を生成
        var arr = Array.apply(null,new Array(n_task)).map(function(v,i){ return i;});
        //シャッフル
        var newArr = [];
        while(arr.length > 0){
            n = arr.length;
            k = Math.floor(Math.random() * n);

            newArr.push(arr[k]);
            arr.splice(k, 1);
        }
        return newArr;
    }

    var genes = init_array(n_individuals, n_task, 0); //要素の数値0で初期化
    for(let i = 0; i < n_individuals; i++){
        genes[i] = make_array();
    }
    
    return genes;
}

//各個体における適応度
//引数：個体の行列[個体数, 都市数]，都市の位置の行列[x,y]
//戻り値：各個体の適応度を格納したベクトル
function compute_trans_fit(genes, taskWeight){
    //1個体indicesの総コストを算出
    function sum_trans_fit(indices, taskWeight){
        var sum_fit_indices = 0;
        for(let i = 0; i < taskWeight.length - 1; i++){
            sum_fit_indices += Math.abs(taskWeight[Math.floor(indices[i+1])] - taskWeight[Math.floor(indices[i])]);
        }
        return sum_fit_indices;
    }

    sum_fit_vec = init_array(1, genes.length, 0);
    for(let i = 0; i < genes.length; i++){
        var indices = genes[i]; //1個体だけ抽出
        sum_fit_vec[i] = sum_trans_fit(indices, taskWeight);
    }
    
    return sum_fit_vec; //適応度
}

//ルーレット選択で選択（淘汰）する
//引数：各個体の総距離（総コスト）を格納したベクトル
//戻り値：選択された２個体のインデックス
function roulette_choice(fitness_vec){
    //各個体が選択される確率を算出
    function generate_roulette(fitness_vec){
        var total_path = 0;
        for(let i = 0; i < fitness_vec.length; i++){
            total_path += fitness_vec[i];
        }
        var p_selected_indices = init_array(1, fitness_vec.length, 0); //各個体が選択される確率を格納するベクトル
        for(let i = 0; i < fitness_vec.length; i++){
            p_selected_indices[i] = fitness_vec[i] / total_path;
        }
        return p_selected_indices;
    }

    var p_selected_indices = generate_roulette(fitness_vec); //各個体が選択される確率を算出
    var indices_choiced = random_choice(p_selected_indices, 2, true);
    return indices_choiced;
}

//部分的交叉
//引数：選択された2個体
//戻り値：交叉した後の2個体(配列)
function partial_crossover(indices_1, indices_2){
    var n_indices = indices_1.length; //=タスク数
    var first_cross_point = Math.floor(Math.random() * (n_indices - 2)) + 1; //交叉を始める場所を定める：1~(タスク数-1)の範囲
    var child_1 = indices_1;
    var child_2 = indices_2;
    
    for(let i = 0; i < n_indices - first_cross_point; i++){
        var target_index = first_cross_point + 1;

        var target_1 = indices_1[target_index]; //交叉対象の遺伝子(タスク)
        var target_2 = indices_2[target_index]; //交叉対象の遺伝子(タスク)
        var exchanged_index_1 = num_where(indices_1, target_2); //交叉対象のインデックスを個体内で検索する
        var exchanged_index_2 = num_where(indices_2, target_1); //交叉対象のインデックスを個体内で検索する

        //2個体が各個体内で遺伝子(タスク)入れ替え
        child_1[target_index] = target_2;
        child_2[target_index] = target_1;
        child_1[exchanged_index_1] = target_1;
        child_2[exchanged_index_2] = target_2;
    }

    return [child_1, child_2];
}

//突然変異
//引数：子孫の個体[個体数, タスク数], 突然変異の回数(=個体数-エリート数), 突然変異が起こる確率
//戻り値：突然変異の個体[個体数, タスク数]
function translocation_mutation(genes, n_mutation, p_mutation){
    var mutated_genes = genes; //突然変異後の個体用

    for(let i = 0; i < n_mutation; i++){
        var mutation_flg = random_choice([1 - p_mutation, p_mutation], 1, false); //突然変異発生=1, 発生しない=0
        if(mutation_flg == 1){
            //ランダムで突然変異で交換する2数(2つのタスク)を選ぶ
            var p_indices = init_array(1, genes[i].length, 1); //離散一様分布を格納した配列[タスク数]
            var mutated_target = random_choice(p_indices, 2, false);
            
            //突然変異による交換
            var mutation_index_1 = num_where(genes[i], mutated_target[0]); //交換対象のインデックスを検索
            var mutation_index_2 = num_where(genes[i], mutated_target[1]); //交換対象のインデックスを検索

            mutated_genes[i][mutation_index_1] = mutated_target[1]; //突然変異による遺伝子の交換
            mutated_genes[i][mutation_index_2] = mutated_target[0]; //突然変異による遺伝子の交換
        }
    }
    return mutated_genes; //突然変異後の個体
}

window.onload = function(){
    //var end_flg = false;
    //document.getElementById('id1').innerHTML = task_weight;
    var taskName = task_name;
    var taskWeight = task_weight;
    const N_task = taskName.length;     //タスクの数, 後に変数になる

    //var task_weight = define_task_weight(N_task); //タスク遷移のコストを定義
    var genes = generate_init_genes(N_individuals, N_task); //GAの個体を生成

    var cost_history = init_array(1, N_generation, 0); //各世代で最適な適応度の履歴
    var max_fit = 0; //世代間で最小の遷移コストを保存するための変数
    var optim_gene = init_array(1, N_task, 0); //世代間で最適な個体（タスク遷移）を保存するための変数
    
    for(let i = 0; i < N_generation; i++){
        var fitness_vec = compute_trans_fit(genes, taskWeight); //各個体の適応度
        var child = init_array(N_individuals, N_task, 0); //子孫の個体を初期化
        
        //選択(淘汰), 部分的交叉
        for(let j = 0; j < Math.floor((N_individuals - N_elite) / 2); j++){
            var indices_choiced = roulette_choice(fitness_vec); //ルーレット選択で選択（淘汰），交叉するための2個体を選択
            var childArray = partial_crossover(genes[indices_choiced[0]], genes[indices_choiced[1]]); //選択した2個体で部分的交叉
            child[j*2] = childArray[0];
            child[j*2+1] = childArray[1];
        }

        //エリート選択(適応度が高い個体は交叉，突然変異に関係なく次世代へ残す)
        //適応度が低い順(昇順)のインデックスを配置(例：[0.9, 0.1, 0.5] -> [1, 2, 0])
        var sorted_index = argsort(fitness_vec);
        for(let j = N_individuals - N_elite; j < N_individuals; j++){
            child[j] = genes[sorted_index[j]]; //エリートの個体を残す
        }

        //突然変異
        //突然変異後の個体を保存
        child = translocation_mutation(child, N_individuals - N_elite, p_mutation);
        
        genes = child; //次世代の個体として保存する

        //コストの履歴を保存
        cost_history[i] = 1 / max_arr(fitness_vec);

        //世代間で適応度が最大(コストが最小)の個体及び適応度を保存
        if(max_fit < max_arr(fitness_vec)){
            optim_gene = genes[argsort(fitness_vec)[N_individuals-1]]; //適応度が最大の個体を保存
            max_fit = max_arr(fitness_vec); //最大の適応度
        }
    }

    //最適化されたタスク順序を配列に格納
    var task_names = init_array(1, optim_gene.length, 0);
    for(let i = 0; i < optim_gene.length; i++){
        task_names[i] = taskName[Math.floor(optim_gene[i])];
    }
    
    //最適化された順序でタスクを表示
    var target = $('#li_id');
    target.text(task_names[0]).attr('name', 'task_name'+0);
    for(let i = 1; i < task_names.length; i++){
        target.clone(true).insertBefore(target.text(task_names[i]).attr('name', 'task_name'+i));
    }
}

//タスクのドラッグ＆ドロップ
$(function(){
    Sortable.create(list1, {
        sort: 1,
        group: {
            name: 'common_lists',
            pull: true,
            put: true
        },
        animation: 150
    });
});

//スケジュール登録ボタン押下後，PHPに値を渡してDBに保存
$(document).ready(function(){
    $(".btn-reg").on('click', function(){
        var tasks = [];
        for(var i_task = 0; i_task < task_name.length; i_task++){
            tasks[i_task] = $('.list').children('li').eq(i_task).text();
        }
        $.ajax({
            type: "POST",
            url: "insert_sche.php",
            data: {"user_id": user_id, "tasks": tasks},
            dataType : "json",
            success: function(user_id){
                window.location.href = './my_schedule.php?user_id='+user_id;
            }
        });
    });
});