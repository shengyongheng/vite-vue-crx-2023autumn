<script setup>
import { onMounted, ref } from 'vue';

const input = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const size = ref('default')
const background = ref(false)
const disabled = ref(false)

const memberList = ref([])

onMounted(() => {
    fetch('https://tranquil-toffee-ab3d84.netlify.app/api/members')
        .then(response => response.json())
        .then(json => {
            memberList.value = json
        })
        .catch(err => console.log('Request Failed', err));
})

const handleSizeChange = (val) => {
    console.log(`${val} items per page`)
}
const handleCurrentChange = (val) => {
    console.log(`current page: ${val}`)
}
</script>

<template>
    <div class="P-home">
        <div class="P-home-header">
            <h1>米家自动化配置助手</h1>
            <el-button>全选当前页</el-button>
        </div>
        <el-divider style="margin: 0" />
        <div class="selection-info">
            <span>已选择：<span class="selection-count">0</span> / 20</span>
            <span class="selection-limit" style="display: none">最多只能选择 20 个成员</span>
        </div>
        <div class="search-box">
            <el-input v-model="input" style="width: 240px" placeholder="搜索成员..." clearable />
        </div>
        <div class="member-container">
            <div class="member-list">
                <div class="member-item" v-for="item in memberList" :key="item.id">
                    <el-checkbox v-model="item.checked" />
                    <span>{{ item.name }}</span>
                    <span>({{ item.id }})</span>
                </div>
            </div>
        </div>
        <div class="footer">
            <div class="pagination">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 30, 40]" :size="size" :disabled="disabled" :background="background"
                    layout="total, sizes, prev, pager, next, jumper" :total="memberList.length"
                    @size-change="handleSizeChange" @current-change="handleCurrentChange" />
            </div>
            <el-button type="primary">确认选择</el-button>
        </div>
    </div>
</template>

<style scoped lang="less">
.P-home {
    padding: 20px;

    .P-home-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h1 {
            font-size: 20px;
            color: #333;
            margin: 0;
        }
    }

    .selection-info {
        margin: 16px 0;
        color: #606266;
        font-size: 14px;

        .selection-count {
            color: #409EFF;
            font-weight: bold;
        }

        .selection-limit {
            margin-left: 16px;
            color: #F56C6C;
        }
    }

    .search-box {
        margin-bottom: 20px;
    }

    .member-container {
        background: #fff;
        border-radius: 4px;
        margin-bottom: 20px;
        min-height: 400px;

        .member-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;

            .member-item {
                display: flex;
                align-items: center;
                padding: 12px;
                border-radius: 4px;
                background: #F5F7FA;
                transition: all 0.3s;

                &:hover {
                    background: #EBEEF5;
                }

                :deep(.el-checkbox) {
                    margin-right: 12px;
                }

                span {
                    color: #606266;
                    
                    &:first-of-type {
                        margin-right: 8px;
                        font-weight: 500;
                    }

                    &:last-of-type {
                        color: #909399;
                        font-size: 13px;
                    }
                }
            }
        }
    }

    .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 0;
        border-top: 1px solid #EBEEF5;

        .pagination {
            flex: 1;
            margin-right: 16px;
        }
    }
}
</style>