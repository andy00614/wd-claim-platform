import { getCurrentUser, getEmployees, getCurrentBinding } from '@/lib/employee-actions'
import { bindEmployee, logoutAction } from './actions'
import { EmployeeSelector } from '@/components/EmployeeSelector'
import styles from './binding.module.css'

export default async function EmployeeBindingPage() {
  // 服务器端数据获取
  const user = await getCurrentUser()
  const employees = await getEmployees()
  const currentBinding = await getCurrentBinding(user.id)

  console.log('currentBinding',currentBinding,user.id)

  return (
    <div className={styles.bindingContainer}>
      <div className={styles.header}>
        <h1>Wild Dynasty Pte Ltd</h1>
        <h2>Employee Profile Binding</h2>
      </div>

      <div className={styles.userInfo}>
        <div>
          <p>Logged in as: <strong>{user.email}</strong></p>
          {currentBinding && (
            <p>Current binding: <strong>{currentBinding.employees.name}</strong></p>
          )}
        </div>
        <form action={logoutAction}>
          <button type="submit" className={`${styles.btn} ${styles.btnSecondary}`}>
            Logout
          </button>
        </form>
      </div>

      <EmployeeSelector 
        employees={employees}
        currentBindingId={currentBinding?.employee_id}
        onSubmit={bindEmployee}
      />
    </div>
  )
}