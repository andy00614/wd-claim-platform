import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Employee {
  id: number;
  name: string;
  employee_code: number;
  department: string;
}

interface UserBinding {
  id: number;
  user_id: string;
  employee_id: number;
  employees: Employee;
}

export function useEmployeeBinding(userId: string | null) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentBinding, setCurrentBinding] = useState<UserBinding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 获取所有员工数据
  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('employee_code', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('获取员工数据失败:', err);
      setError('获取员工数据失败');
    }
  };

  // 检查用户是否已经绑定员工
  const checkCurrentBinding = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('user_employee_bindings')
        .select(`
          id,
          user_id,
          employee_id,
          employees(
            id,
            name,
            employee_code,
            department
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      setCurrentBinding(data);
    } catch (err) {
      console.error('检查绑定状态失败:', err);
      setError('检查绑定状态失败');
    }
  };

  // 绑定员工
  const bindEmployee = async (employeeId: number) => {
    if (!userId) throw new Error('用户未登录');

    try {
      // 如果已有绑定，先删除
      if (currentBinding) {
        const { error: deleteError } = await supabase
          .from('user_employee_bindings')
          .delete()
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      }

      // 创建新绑定
      const { data, error } = await supabase
        .from('user_employee_bindings')
        .insert({
          user_id: userId,
          employee_id: employeeId,
        })
        .select(`
          id,
          user_id,
          employee_id,
          employees(
            id,
            name,
            employee_code,
            department
          )
        `)
        .single();

      if (error) throw error;
      setCurrentBinding(data);
      return data;
    } catch (err) {
      console.error('绑定员工失败:', err);
      throw new Error('绑定员工失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchEmployees(),
        checkCurrentBinding()
      ]);

      setLoading(false);
    };

    loadData();
  }, [userId]);

  return {
    employees,
    currentBinding,
    loading,
    error,
    bindEmployee,
    refetch: () => {
      fetchEmployees();
      checkCurrentBinding();
    }
  };
}